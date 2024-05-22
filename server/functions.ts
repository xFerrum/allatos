import { Creature } from "../src/classes/creature";
import { Skill } from "../src/classes/skill";
import { SkillGenerator } from "./tools/skillGenerator";
import { initializeApp } from "firebase/app";
import { CrService } from "./db_services/crService";

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
    let crID: string;
    socket.on('crID', (id: string) => {crID = id});

    //generate 3 random skills, store the array in socket data (user will emit an index for the skill they picked)
    socket.on('skill-learn-requested', (rarity: number) =>
    {
        let skillOptions: Skill[] = [];

        for (let i = 0; i < 3; i++)
        {
            let skillGenerator = new SkillGenerator;

            const t = Math.floor(Math.random() * 2);
            let type = 'unknown';
            switch (t)
            {
                case 0:
                    type = 'attack';
                    break;

                case 1:
                    type = 'block';
                    break;

                default:
                    break;
            }

            const randomSkill = skillGenerator.generateSkill(rarity, type);
            skillOptions.push(randomSkill);
        }

        userSkillOptions.set(crID, skillOptions);
        socket.emit('skills-generated', skillOptions);
    });

    //when user chose from the 3 options from skill-learn-requested
    socket.on('skill-option-selected', async (index: number) =>
    {
        if (userSkillOptions.get(crID))
        {
            console.log(crID, index);
            crService.learnSkill(crID, userSkillOptions.get(crID)[index]);
            userSkillOptions.delete(crID);
            socket.disconnect();
        }
    });
});
