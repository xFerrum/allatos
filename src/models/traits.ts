import { Creature } from "./creature";

export const traitFuncs = new Map<string, Function>
([
    ["Strong", (cr: Creature): Creature =>
        {
            cr.str++;
            return(cr);
        }
    ],
    ["Muscular", (cr: Creature): Creature =>
        {
            cr.str += 2;
            return(cr);
        }
    ],
    ["Absolutely Jacked", (cr: Creature): Creature =>
        {
            cr.str += 4;
            return(cr);
        }
    ],
    ["Cursed", (cr: Creature): Creature =>
        {
            cr.str --;
            cr.agi --;
            cr.int--;
            cr.con -= 5;
            return(cr);
        }
    ],
]);