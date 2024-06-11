import { Creature } from "../src/models/creature";
import { Skill } from "../src/models/skill";
import { CrService } from "./db_services/crService";
import { generateSkill } from "./tools/skillGenerator";

const io = require('socket.io')(3005,
{
    cors:
    {
    origin: ['http://localhost:8100'],
    }
});

let crService = new CrService;
let userSkillOptions = new Map<string, Skill[]>;

io.on('connection', (socket: any) =>
{
    socket.on('skill-learn-requested', async (uid: string, crID: string) =>
    {
        let cr = await crService.getCreatureById(crID);
        if (uid === cr.ownedBy && cr.skillPicks.length !== 0)
        {
            const options = cr.skillPicks.shift();
            socket.emit('skill-pick-ready', options);

            socket.on('skill-option-selected', async (index: number) =>
            {
                await crService.learnSkill(crID, options[index]);
                await crService.replaceSkillPicks(crID, cr.skillPicks);
                socket.disconnect();
            });

            socket.on('skill-pick-skipped', async () =>
            {
                await crService.replaceSkillPicks(crID, cr.skillPicks);
                socket.disconnect();
            });
        }
        else socket.disconnect();
    })

    socket.on('attr-plus', async (uid: string, crID: string, which: string) =>
    {
        let cr = await crService.getCreatureById(crID);
        if (cr.lvlup > 0 && cr.ownedBy === uid)
        {        
            switch (which)
            {
                case 'str':
                    cr.str++;
                    break;

                case 'agi':
                    cr.agi++;
                    break;

                case 'int':
                    cr.int++;
                    break;

                default:
                    break;
            }
            cr.lvlup--;

            await crService.updateCreature(crID, cr);
            socket.disconnect();
        }
        else socket.disconnect();
    })
});
