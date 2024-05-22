import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, addDoc, setDoc, getDoc, query, where, arrayUnion, arrayRemove, updateDoc} from 'firebase/firestore/lite';
import { firebaseConfig } from "../src/app/fbaseconfig";
import { CrService } from "./db_services/crService";
import { Creature } from "../src/classes/creature";
import { Activity } from "../src/classes/activity";

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

const actMap = new Map<String, any>;
rebuildOngoingActs();

io.on('connection', (socket: any) =>
{
    socket.on('start-activity', (crID: String, act: Activity) =>
    {
        if (canGo(crID))
        {
            scheduleAct(crID, act);
        }
        else io.to(socket.id).emit('start-activity-failed');
        socket.disconnect();
    });
});

function canGo(crID: String): boolean
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
            if (endDate < new Date)
            {
                scheduleAct(cr.crID, cr.currentAct);
            }
            else finishAct(cr.crID, cr.currentAct);
        }
    });
}

function scheduleAct(crID, act: Activity)
{
    actMap.set(crID, schedule.scheduleJob(calcEndDate(act.startDate, act.duration), () => { finishAct(crID, act) }));
}

function calcEndDate(startDate: Date, duration: number): Date
{
    return new Date(new Date(startDate).getTime() + duration);
}

function finishAct(crID: String, act: Activity)
{
    console.log("Done.");
    actMap.delete(crID);
}