import phb from './phb';
import { EquipmentChoiceBlock, Race, Class, Alignment, Background } from './types';
import reference from './reference';

export type EquipmentModel = {
    id: number;
    num: number;
}

export type EquipmentChoiceModel = {
    id: number;
    chosen: boolean;
    selection: number;
    remaining: number;
    items: EquipmentModel[];
    choices?: EquipmentChoiceBlock[];
}

export default class DndCharacter {

    constructor() {
        this.level = 1;
        this.race = phb.races[0];
        this.class = phb.classes[0];
        this.alignment = reference.alignments[0];
        this.background = phb.backgrounds[0];
    }

    public characterName: string = '';
    public playerName: string = '';
    public race: Race;
    public class: Class;
    public archetype: number = 0;
    public alignment: Alignment;
    public backgroundSpecialty: number = 0;
    public background: Background;
    public backgroundToolChoice: string = '';
    public statArray: number[] = Array(6).fill(null);
    public statModifiers: number[] = Array(6).fill(null);
    public statTotals: number[] = Array(6).fill(null);
    public xp: number = 0;
    public languageids: number[] = [];
    public proficiencies: number[] = [];
    public equipment: EquipmentModel[] = [];
    public equipChoices: EquipmentChoiceModel[] = [];
    public trait: number = 0;
    public ideal: number = 0;
    public bond: number = 0;
    public flaw: number = 0;
    public age: string = '20';
    public height: string = '6\'1';
    public weight: string = '170lbs';
    public eyes: string = 'Blue';
    public skin: string = 'Fair';
    public hair: string = 'Black';
    public appearance: any = null; // Image
    public factionLogo: any = null; // Image
    public organizations: string = '';
    public allies: string = '';
    public backstory: string = '';
    public treasure: string = '';
    public additionalFeaturesAndTraits: string = '';

    // Items moved from dndmodel
    public level: number = 1;

    public allStatsAssigned: boolean = false;

    public equipmentText: string = '';
    public allEquipmentChosen: boolean = false;
    public spells: any[] = [];
}