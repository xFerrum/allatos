import { ActService } from "./db_services/actService";

const actService = new ActService;

let props =
{
    trait: null,
    xp: 6,
    skill: [3, 0]
}

actService.createAct('Explore the Jungle', '', 10000, props);