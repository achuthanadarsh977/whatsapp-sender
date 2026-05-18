const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const GROUP_NAME = 'Open Truck_Fleetco';

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: false,
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-features=IsolateOrigins,site-per-process'
        ]
    },
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html'
    }
});

client.on('qr', (qr) => {
    console.log('Scan this QR code with WhatsApp on your phone:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', async () => {
    console.log(`✅ WhatsApp connected!\n`);

    const chats = await client.getChats();
    const group = chats.find(chat => chat.isGroup && chat.name === GROUP_NAME);

    if (!group) {
        console.log(`❌ Group "${GROUP_NAME}" not found. Check the name and try again.`);
        client.destroy();
        return;
    }

    const participants = group.participants;
    console.log(`👥 Found ${participants.length} members in "${GROUP_NAME}"\n`);

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    const ask = (question) => new Promise(resolve => rl.question(question, resolve));

    const sendToAll = async (content, isMedia = false, caption = '') => {
        console.log(`\n📨 Sending to each member individually...\n`);
        for (const participant of participants) {
            try {
                const contact = await client.getContactById(participant.id._serialized);
                const name = contact.pushname || contact.name || participant.id.user;
                if (isMedia) {
                    await client.sendMessage(participant.id._serialized, content, { caption });
                } else {
                    await client.sendMessage(participant.id._serialized, content);
                }
                console.log(`✅ Sent to ${name}`);
                await new Promise(resolve => setTimeout(resolve, 1500));
            } catch (err) {
                console.log(`❌ Failed to send to ${participant.id.user}: ${err.message}`);
            }
        }
        console.log('\n🎉 Sent to all members individually!\n');
    };

    const askContent = async () => {
        console.log('What do you want to send?');
        console.log('1. Text');
        console.log('2. Image');
        console.log('3. Audio');
        console.log('4. Video');
        console.log('5. Document');
        console.log('6. Exit\n');

        const choice = await ask('Enter choice (1-6): ');

        if (choice === '6') {
            console.log('Bye!');
            rl.close();
            client.destroy();
            return;
        }

        if (choice === '1') {
            console.log('Type your message (press Enter twice when done):\n');
            let lines = [];
            let emptyCount = 0;
            await new Promise(resolve => {
                rl.on('line', function handler(line) {
                    if (line === '') {
                        emptyCount++;
                        if (emptyCount >= 1 && lines.length > 0) {
                            rl.removeListener('line', handler);
                            resolve();
                            return;
                        }
                    } else {
                        emptyCount = 0;
                        lines.push(line);
                    }
                });
            });
            const message = lines.join('\n');
            if (message.trim()) await sendToAll(message);
        } else if (['2', '3', '4', '5'].includes(choice)) {
            const typeMap = { '2': 'Image', '3': 'Audio', '4': 'Video', '5': 'Document' };
            const filePath = await ask(`Enter full file path for ${typeMap[choice]}:\n> `);
            const cleanPath = filePath.trim().replace(/^"|"$/g, '');

            if (!fs.existsSync(cleanPath)) {
                console.log('❌ File not found. Try again.\n');
            } else {
                let caption = '';
                if (choice === '2' || choice === '4') {
                    caption = await ask('Add a caption (or press Enter to skip):\n> ');
                }
                const media = MessageMedia.fromFilePath(cleanPath);
                await sendToAll(media, true, caption);
            }
        } else {
            console.log('❌ Invalid choice.\n');
        }

        askContent();
    };

    askContent();
});

client.on('auth_failure', () => {
    console.log('❌ Authentication failed. Delete the .wwebjs_auth folder and try again.');
});

client.initialize();
