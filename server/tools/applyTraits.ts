import { Creature } from "../models/creature";

export function applyTraits(cr: Creature)
{
    if (cr.traits)
    {
        for (let t of cr.traits)
        {
            if (!t.scaling) traitFuncs.get(t.name)!(cr);
        }
    }

    return cr;
}

const traitFuncs = new Map<string, Function>
([
    ["Strong", (cr: Creature): Creature =>
        {
            cr.str++;
            return(cr);
        }
    ],
]);