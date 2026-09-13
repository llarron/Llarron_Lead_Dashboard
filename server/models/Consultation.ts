import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IConsultation extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  interest: string;
  message?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ConsultationSchema: Schema<IConsultation> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User', index: true },
    interest: { type: String, required: true, trim: true },
    message: { type: String, required: false, trim: true },
  },
  {
    timestamps: true,
    autoIndex: false,
  }
);

ConsultationSchema.index({ createdAt: -1 });

const Consultation: Model<IConsultation> =
  mongoose.models.Consultation || mongoose.model<IConsultation>('Consultation', ConsultationSchema, 'consultations');

export default Consultation;
