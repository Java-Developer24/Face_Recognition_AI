'use server';

import connectDB from './mongodb';
import { PatientModel } from './models/Patient';
import { Patient } from './types';
import { format } from 'date-fns';

const addDefaultDataIfNeeded = (patients: Patient[]): Patient[] => {
  if (!Array.isArray(patients)) {
    return [];
  }
  return patients.map(patient => {
    if (typeof patient !== 'object' || patient === null) {
      return patient;
    }

    const hasDiseases = patient.diseases && patient.diseases.length > 0;
    const hasBills = patient.billPayments && patient.billPayments.length > 0;

    if (!hasDiseases) {
      patient.diseases = [
        { name: 'Common Cold', status: 'Cured' },
        { name: 'Asthma', status: 'Ongoing' },
      ];
    }

    if (!hasBills || (hasBills && typeof patient.billPayments[0].disease === 'undefined') || (hasBills && typeof patient.billPayments[0].paymentMethod === 'undefined')) {
      patient.billPayments = [
        {
          date: new Date(2023, 10, 15).toISOString(),
          amount: 1500,
          status: 'Paid',
          disease: 'Viral Fever',
          tablets: [
            { name: 'Paracetamol', usage: '1 tablet twice a day' },
            { name: 'Azithromycin', usage: '1 tablet once a day' }
          ],
          paymentMethod: 'UPI',
        },
        {
          date: new Date(2024, 0, 20).toISOString(),
          amount: 250,
          status: 'Paid',
          disease: 'Follow-up Consultation',
          tablets: [],
          paymentMethod: 'Cash',
        },
        {
          date: new Date(2024, 2, 5).toISOString(),
          amount: 800,
          status: 'Paid',
          disease: 'Allergic Rhinitis',
          tablets: [
            { name: 'Cetirizine', usage: '1 tablet at night' }
          ],
          paymentMethod: 'Debit Card',
        },
        {
          date: new Date(2024, 4, 1).toISOString(),
          amount: 1200,
          status: 'Pending',
          disease: 'Sinusitis',
          tablets: [
            { name: 'Amoxicillin', usage: '1 tablet three times a day' },
            { name: 'Ibuprofen', usage: 'As needed for pain' }
          ],
          paymentMethod: 'Insurance Claim',
        }
      ];
    }

    if (!patient.lastVisit) {
      patient.lastVisit = new Date().toISOString();
    }

    patient.allergies = patient.allergies || [];
    patient.previousTreatments = patient.previousTreatments || [];
    patient.notes = patient.notes || '';

    return patient;
  });
};


async function readPatientsFromFile(): Promise<Patient[]> {
  try {
    const fileContent = await fs.readFile(dataFilePath, 'utf-8');
    const patients = JSON.parse(fileContent) as Patient[];
    return addDefaultDataIfNeeded(patients);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, so we return an empty array.
      return [];
    }
    console.error('Error reading from patient data file:', error);
    throw new Error('Could not read patient data.');
  }
}

async function writePatientsToFile(patients: Patient[]): Promise<void> {
  try {
    await fs.writeFile(dataFilePath, JSON.stringify(patients, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing to patient data file:', error);
    throw new Error('Could not save patient data.');
  }
}

export async function getPatients(): Promise<Patient[]> {
  try {
    console.log('🔄 Fetching patients from MongoDB...');
    await connectDB(); // ← HERE: connectDB() is called
    const patients = await PatientModel.find({}).lean();
    console.log(`✅ Retrieved ${patients.length} patients from MongoDB`);
    return patients.map(addDefaultDataIfNeeded);
  } catch (error) {
    console.error('❌ Error fetching patients from MongoDB:', error);
    throw new Error('Could not read patient data.');
  }
}

export async function savePatients(patients: Patient[]): Promise<void> {
  try {
    console.log(`🔄 Saving ${patients.length} patients to MongoDB...`);
    await connectDB(); // ← HERE: connectDB() is called
    await PatientModel.deleteMany({});
    if (patients.length > 0) {
      await PatientModel.insertMany(patients);
      console.log(`✅ Successfully saved ${patients.length} patients to MongoDB`);
    }
  } catch (error) {
    console.error('❌ Error saving patients to MongoDB:', error);
    throw new Error('Could not save patient data.');
  }
}
