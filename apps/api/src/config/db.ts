import mongoose from 'mongoose';

export async function connectDB(uri: string) {
  await mongoose.connect(uri);
  console.log('MongoDB conectado:', mongoose.connection.host);
}
