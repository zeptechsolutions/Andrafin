require('dotenv').config();const app=require('./app');const connectDB=require('./config/db');const startReminderJob=require('./jobs/reminderJob');
const PORT=process.env.PORT||5000;
const start=async()=>{if(!process.env.MONGODB_URI)throw new Error('Falta MONGODB_URI en .env');if(!process.env.JWT_SECRET)throw new Error('Falta JWT_SECRET en .env');await connectDB();app.listen(PORT,()=>{console.log(`AndraFin API: http://localhost:${PORT}`);startReminderJob();});};
start().catch(e=>{console.error(e.message);process.exit(1);});
