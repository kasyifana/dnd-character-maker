import React from 'react';
import { Class } from '../../core/types';
import reference from '../../core/reference';

interface Props {
    class: Class;
    level: number;
    selectedSpells: any[];
    setSpells: (spells: any[]) => void;
    statModifiers: number[];
}

interface State {
    spells: any[];
}

export default class SpellsComponent extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            spells: []
        };
    }

    componentDidMount() {
        this.fetchSpells();
    }

    fetchSpells() {
        fetch('/spells.json')
            .then(response => response.json())
            .then(data => {
                this.setState({ spells: data });
            });
    }

    handleSpellSelection(spell: any, level: number) {
        let selectedSpells = [...this.props.selectedSpells];
        const index = selectedSpells.findIndex(s => s.name === spell.name);

        if (index > -1) {
            selectedSpells.splice(index, 1);
        } else {
            selectedSpells.push({ ...spell, level });
        }

        this.props.setSpells(selectedSpells);
    }

    private getSpellLevel(spell: any): number {
        const lvl = spell.level;
        if (lvl === 'cantrip') return 0;
        const n = parseInt(lvl, 10);
        return isNaN(n) ? 0 : n;
    }

    renderSpells(level: number) {
        const { class: characterClass } = this.props;
        const classKey = characterClass.text.toLowerCase();
        const classSpells = this.state.spells.filter(spell =>
            Array.isArray(spell.classes) && spell.classes.includes(classKey) && this.getSpellLevel(spell) === level
        );

        return classSpells.map(spell => (
            <div key={spell.name}>
                <label>
                    <input 
                        type="checkbox" 
                        onChange={() => this.handleSpellSelection(spell, level)} 
                        checked={this.props.selectedSpells.some(s => s.name === spell.name)} />
                    {spell.name}
                </label>
            </div>
        ));
    }

    render() {
        const { class: characterClass, level, statModifiers } = this.props;
        if (!characterClass.spellCasting) {
            return <div>No Spellcasting Abilities</div>;
        }

        const spellcastingAbilityIndex = characterClass.spellCasting.modifier || 0;
        const spellcastingModifier = statModifiers[spellcastingAbilityIndex];
        const proficiencyBonus = reference.proficiencyLevels[level - 1].bonus;
        const spellSaveDc = 8 + proficiencyBonus + spellcastingModifier;
        const spellAttackBonus = proficiencyBonus + spellcastingModifier;
        const spellcastingAbilityName = reference.stats[spellcastingAbilityIndex].text;

        return (
            <div className='field'>
                <label className='label'>Spells</label>
                <div className='columns'>
                    <div className='column'>
                        Spellcasting Ability: {spellcastingAbilityName}
                    </div>
                    <div className='column'>
                        Spell Save DC: {spellSaveDc}
                    </div>
                    <div className='column'>
                        Spell Attack Bonus: {spellAttackBonus}
                    </div>
                </div>

                <div>
                    <label className='label'>Cantrips</label>
                    {this.renderSpells(0)}
                </div>

                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(spellLevel => {
                    const spellcasterLevel = characterClass.spellCasting!.spellTable?.find(sl => sl.level === level);
                    if (!spellcasterLevel) return null;
                    const slots = spellcasterLevel.numSpellsOfEachLevel[spellLevel - 1];
                    if (slots > 0) {
                        return (
                            <div key={spellLevel}>
                                <label className='label'>Level {spellLevel} Spells ({slots} slots)</label>
                                {this.renderSpells(spellLevel)}
                            </div>
                        );
                    }
                    return null;
                })}
            </div>
        );
    }
}