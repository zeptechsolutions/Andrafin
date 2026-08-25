const cron = require('node-cron');
const { runReminders } = require('../services/reminderService');

const startReminderJob = () => {
  const expression = '0 8 * * *';
  const timezone = 'America/El_Salvador';

  cron.schedule(
    expression,
    () => runReminders().catch((error) => {
      console.error('Error en recordatorios:', error.message);
    }),
    { timezone }
  );

  console.log(`Recordatorios activos: ${expression} (${timezone})`);
};

module.exports = startReminderJob;
