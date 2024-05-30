import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, addDoc, setDoc, getDoc, query, where, arrayUnion, arrayRemove, updateDoc} from 'firebase/firestore/lite';
import { firebaseConfig } from "../src/app/fbaseconfig";
import { CrService } from "./db_services/crService";
import { Creature } from "../src/models/creature";
import { Activity } from "../src/models/activity";
import { resolveAct } from "./tools/actResolver";
import { UserService } from "./db_services/userService";

const fbase = initializeApp(firebaseConfig);
const db = getFirestore(fbase);
const io = require('socket.io')(3010,
{
    cors:
    {
    origin: ['http://localhost:8100'],
    }
});
const schedule = require('node-schedule');
const crService = new CrService;
const userService = new UserService;

const actMap = new Map<string, any>;
rebuildOngoingActs();

io.on('connection', (socket: any) =>
{
    socket.on('start-activity', async (crID: string, act: Activity) =>
    {
        if (canGo(crID, act))
        {
            await scheduleAct(crID, act);
        }
        else io.to(socket.id).emit('start-activity-failed');
        socket.disconnect();
    });
});

function canGo(crID: string, act: Activity): boolean
{
    if (actMap.has(crID))
    {
        return false;
    }
    else return true;
}

async function rebuildOngoingActs()
{
    const crs = await crService.getAllCreatures();
    crs.forEach(cr =>
    {
        if (cr.currentAct)
        {
            const endDate = calcEndDate(cr.currentAct.startDate, cr.currentAct.duration);
            if (endDate > new Date())
            {
                scheduleAct(cr.crID, cr.currentAct);
            }
            else finishAct(cr.crID, cr.currentAct);
        }
    });
}

async function scheduleAct(crID, act: Activity)
{
    actMap.set(crID, schedule.scheduleJob(calcEndDate(act.startDate, act.duration), () => { finishAct(crID, act) }));
    await crService.setAct(crID, act);
}

function calcEndDate(startDate: Date, duration: number): Date
{
    return new Date(new Date(startDate).getTime() + duration);
}

async function finishAct(crID: string, act: Activity)
{
    let cr = await crService.getCreatureById(crID);
    const noti = resolveAct(cr, act.name);
    console.log(noti);
    await crService.updateCreature(crID, cr);
    await userService.sendNotification(cr.ownedBy, noti);

    console.log(act.name + " done.");
    actMap.delete(crID);
    await crService.setAct(crID);
}