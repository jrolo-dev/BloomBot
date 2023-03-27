const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
require('dotenv').config();

const token = process.env.TELEGRAM_TOKEN_BOT;
const trefletoken = process.env.TREFLE_API_KEY;
const bot = new TelegramBot(token, {polling: true});
const plants = [];

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, `Hola ${msg.chat.first_name}, bienvenido al bot para el cuidado de plantas!`);
});

bot.onText(/\/addplant (.+)/, (msg, match) => {
    const plantName = match[1];
    plants.push({name: plantName, chatId: msg.chat.id, wateringInterval: 3}); // Cambiar 3 por un valor por defecto
    bot.sendMessage(msg.chat.id, `La planta ${plantName} ha sido añadida correctamente.`);
});

bot.onText(/\/removeplant (.+)/, (msg, match) => {
    const plantName = match[1];
    const index = plants.findIndex(plant => plant.name === plantName && plant.chatId === msg.chat.id);
    if (index > -1) {
        plants.splice(index, 1);
        bot.sendMessage(msg.chat.id, `La planta ${plantName} ha sido eliminada correctamente.`);
    } else {
        bot.sendMessage(msg.chat.id, `La planta ${plantName} no ha sido encontrada.`);
    }
});
bot.onText(/\/wateringinterval (.+) (.+)/, (msg, match) => {
    const plantName = match[1];
    const wateringInterval = parseInt(match[2]);
    const index = plants.findIndex(plant => plant.name === plantName && plant.chatId === msg.chat.id);
    if (index > -1) {
        plants[index].wateringInterval = wateringInterval;
        bot.sendMessage(msg.chat.id, `La planta ${plantName} será regada cada ${wateringInterval} días.`);
    } else {
        bot.sendMessage(msg.chat.id, `La planta ${plantName} no ha sido encontrada.`);
    }
});

bot.onText(/\/setreminder (.+) (.+)/, (msg, match) => {
    const plantName = match[1];
    const reminderTime = match[2];
    const index = plants.findIndex(plant => plant.name === plantName && plant.chatId === msg.chat.id);
    if (index > -1) {
        plants[index].reminderTime = reminderTime;
        bot.sendMessage(msg.chat.id, `El recordatorio para regar la planta ${plantName} ha sido programado a las ${reminderTime}.`);
    } else {
        bot.sendMessage(msg.chat.id, `La planta ${plantName} no ha sido encontrada.`);
    }
});

function checkPlants() {
    const now = new Date();
    for (let i = 0; i < plants.length; i++) {
        const plant = plants[i];
        const lastWatered = plant.lastWatered || new Date(0);
        const wateringInterval = plant.wateringInterval;
        const nextWatering = new Date(lastWatered.getTime() + wateringInterval * 24 * 60 * 60 * 1000);
        if (now > nextWatering) {
            const reminderTime = plant.reminderTime || '10:00';
            bot.sendMessage(plant.chatId, `Recuerda regar la planta ${plant.name} hoy.`);
            bot.sendMessage(plant.chatId, `El recordatorio para regar la planta ${plant.name} ha sido programado a las ${reminderTime}.`);
            plant.lastWatered = now;
        }
    }
}

setInterval(checkPlants, 60 * 60 * 1000); // Comprobar las plantas cada hora

async function getWateringInterval(plantName, apiKey) {
    try {
      const response = await axios.get(`https://trefle.io/api/v1/plants/search?token=${apiKey}&q=${encodeURIComponent(plantName)}`);
      const plant = response.data.data[0];
      const wateringInterval = plant.main_species.growth.moisture_use;
      return wateringInterval;
    } catch (error) {
      console.error(error);
      throw new Error('Error al obtener la frecuencia de riego');
    }
  }

bot.onText(/\/help/, (msg) => {
    const helpMessage = `/addplant <nombre> - Añade una nueva planta.
/removeplant <nombre> - Elimina una planta.
/wateringinterval <nombre> <días> - Establece la periodicidad del riego de una planta.
/setreminder <nombre> <hora> - Programa un recordatorio diario para regar una planta.
/help - Muestra esta ayuda.`;
    bot.sendMessage(msg.chat.id, helpMessage);
});

bot.on('polling_error', (error) => {
    console.error(error);
});

process.on('uncaughtException', (error) => {
    console.error(error);
});

process.on('unhandledRejection', (error) => {
    console.error(error);
});

bot.on('message', (msg) => {
    bot.sendMessage(msg.chat.id, `Lo siento, no entiendo lo que quieres decir. Puedes usar el comando /help para ver la lista de comandos disponibles.`);
});

async function handleMessage(message) {
    const chatId = message.chat.id;
    const text = message.text.toLowerCase();
  
    if (text === '/start') {
      await bot.sendMessage(chatId, '¡Hola! Soy el bot del cuidado de las plantas. ¿En qué puedo ayudarte?');
    } else if (text === '/ayuda') {
      await bot.sendMessage(chatId, 'Puedes usar los siguientes comandos:\n\n/agregar_planta: Para agregar una nueva planta\n/eliminar_planta: Para eliminar una planta\n/listar_plantas: Para ver la lista de plantas\n/ajustes: Para ajustar la frecuencia de riego\n/ayuda: Para ver la lista de comandos disponibles');
    } else if (text === '/agregar_planta') {
      // Código para agregar una nueva planta
    } else if (text === '/eliminar_planta') {
      // Código para eliminar una planta
    } else if (text === '/listar_plantas') {
      // Código para mostrar la lista de plantas
    } else if (text === '/ajustes') {
      await bot.sendMessage(chatId, 'Introduce el nombre de la planta de la que quieres conocer la frecuencia de riego recomendada:');
      currentState[chatId] = 'esperando_nombre_planta';
    } else if (currentState[chatId] === 'esperando_nombre_planta') {
      const plantName = text;
      const wateringInterval = await getWateringInterval(plantName, trefletoken);
      await bot.sendMessage(chatId, `La frecuencia de riego recomendada para ${plantName} es de ${wateringInterval}`);
      currentState[chatId] = null;
    } else {
      await bot.sendMessage(chatId, 'Lo siento, no he entendido ese comando. Prueba con /ayuda para ver la lista de comandos disponibles.');
    }
  }
  

console.log('El bot está funcionando.');


