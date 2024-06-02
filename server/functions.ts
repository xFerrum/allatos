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
    //TODO: make skill pick less spaghett :<
    socket.on('skill-learn-requested', async (crID: string) =>
    {
        let skillPicks = (await crService.getCreatureById(crID)).skillPicks;
        if (Object.keys(skillPicks).length !== 0)
        {        
            let dates = Object.keys(skillPicks);
            let earliest = new Date().getTime();
            for (const d of dates)
            {
                console.log(d);
                if (Number(d) < earliest) earliest = Number(d);
            }
            const options = [...skillPicks[earliest]];
            delete skillPicks[earliest];
            socket.emit('skill-pick-ready', options);

            socket.on('skill-option-selected', async (index: number) =>
            {
                await crService.learnSkill(crID, options[index]);
                await crService.replaceSkillPicks(crID, skillPicks);
                socket.disconnect();
            });
        }
        else socket.disconnect();
    })
});
