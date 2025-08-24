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
    modalOpen: boolean;
    modalSpell: any | null;
    searchQuery: string;
}

export default class SpellsComponent extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            spells: [],
            modalOpen: false,
            modalSpell: null,
            searchQuery: ''
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
            // Enforce cap when adding via any entry point (including search)
            const cap = this.getLevelCapacity(level);
            const selectedAtLevel = this.props.selectedSpells.filter(s => (s.level ?? 0) === level).length;
            if (Number.isFinite(cap) && selectedAtLevel >= cap) {
                alert(`Sudah mencapai batas pilihan untuk level ${level}.`);
                return;
            }
            selectedSpells.push({ ...spell, level });
        }

        this.props.setSpells(selectedSpells);
    }

    openSpellModal = (spell: any) => {
        this.setState({ modalOpen: true, modalSpell: spell });
    }

    closeSpellModal = () => {
        this.setState({ modalOpen: false, modalSpell: null });
    }

    private getLevelCapacity(level: number): number {
        if (level === 1) return 11; // Level 1 has 11 fields on the PDF
        if (level >= 2 && level <= 9) return 13; // Levels 2-9 have 13 fields
        return Number.POSITIVE_INFINITY; // Cantrips or others: no explicit cap requested
    }

    private getSpellLevel(spell: any): number {
        const lvl = spell.level;
        if (lvl === 'cantrip') return 0;
        const n = parseInt(lvl, 10);
        return isNaN(n) ? 0 : n;
    }

    private formatLevelLabel(n: number): string {
        if (n === 0) return 'Cantrip';
        const suffix = (lv: number) => (lv === 1 ? 'st' : lv === 2 ? 'nd' : lv === 3 ? 'rd' : 'th');
        return `${n}${suffix(n)}-level`;
    }

    private renderSpellModal() {
        const s = this.state.modalSpell;
        if (!this.state.modalOpen || !s) return null;
        const lvlNum = typeof s.level === 'number' ? s.level : this.getSpellLevel(s);
        const levelText = this.formatLevelLabel(lvlNum);
        const school = s.school ? String(s.school) : '';
        const ritual = s.ritual ? 'Yes' : 'No';
        const casting = String(s.casting_time || '-');
        const range = String(s.range || '-');
        const duration = String(s.duration || '-');
        const components = s.components?.raw ? String(s.components.raw) : '-';
        const classes = Array.isArray(s.classes) ? s.classes.join(', ') : '';
        const materials = Array.isArray(s.components?.materials_needed) ? s.components.materials_needed.join(', ') : '';

        return (
            <div className={'modal is-active'}>
                <div className="modal-background" onClick={this.closeSpellModal}></div>
                <div className="modal-card" style={{ maxWidth: '900px' }}>
                    <header className="modal-card-head">
                        <p className="modal-card-title">{s.name}</p>
                        <button className="delete" aria-label="close" onClick={this.closeSpellModal}></button>
                    </header>
                    <section className="modal-card-body">
                        <div className="content">
                            <p><strong>Level:</strong> {levelText}{school ? ` ${school}` : ''}</p>
                            <p><strong>Casting Time:</strong> {casting}</p>
                            <p><strong>Range:</strong> {range}</p>
                            <p><strong>Duration:</strong> {duration}</p>
                            <p><strong>Components:</strong> {components}</p>
                            {materials && <p><strong>Materials Needed:</strong> {materials}</p>}
                            {classes && <p><strong>Classes:</strong> {classes}</p>}
                            <p><strong>Ritual:</strong> {ritual}</p>
                            {s.description && (
                                <div>
                                    <p><strong>Description</strong></p>
                                    <div style={{ whiteSpace: 'pre-wrap' }}>{String(s.description)}</div>
                                </div>
                            )}
                            {s.higher_levels && (
                                <div style={{ marginTop: '0.75rem' }}>
                                    <p><strong>At Higher Levels</strong></p>
                                    <div style={{ whiteSpace: 'pre-wrap' }}>{String(s.higher_levels)}</div>
                                </div>
                            )}
                        </div>
                    </section>
                    <footer className="modal-card-foot">
                        <button className="button" onClick={this.closeSpellModal}>Close</button>
                    </footer>
                </div>
            </div>
        );
    }

    private handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({ searchQuery: e.target.value });
    }

    private renderSearchResults() {
        const q = this.state.searchQuery.trim().toLowerCase();
        if (q.length < 2) return null;
        // Cross-class search across all spells, by name substring
        const results = this.state.spells.filter(s => String(s.name || '').toLowerCase().includes(q)).slice(0, 30);

        if (results.length === 0) {
            return <div style={{ color: '#7a7a7a' }}>No results</div>;
        }

        return (
            <div style={{ border: '1px solid #eee', padding: '0.75rem', borderRadius: 4, marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.9rem', color: '#7a7a7a', marginBottom: '0.5rem' }}>
                    Hasil pencarian (lintas class)
                </div>
                {results.map(spell => {
                    const lvl = this.getSpellLevel(spell);
                    const isChecked = this.props.selectedSpells.some(s => s.name === spell.name);
                    const cap = this.getLevelCapacity(lvl);
                    const selectedAtLevel = this.props.selectedSpells.filter(s => (s.level ?? 0) === lvl).length;
                    const atCap = selectedAtLevel >= cap;
                    const disabled = !isChecked && atCap;
                    const nameColor = isChecked ? '#3273dc' : (disabled ? '#b5b5b5' : '#0a0a0a');
                    const levelText = this.formatLevelLabel(lvl);
                    const classes = Array.isArray(spell.classes) ? spell.classes.join(', ') : '';
                    return (
                        <div key={`search-${spell.name}`} style={{ display: 'flex', alignItems: 'center', marginBottom: '0.35rem' }}>
                            <input
                                type="checkbox"
                                style={{ marginRight: 8 }}
                                checked={isChecked}
                                disabled={disabled}
                                onChange={() => this.handleSpellSelection(spell, lvl)}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <strong>
                                    <a onClick={(e) => { e.preventDefault(); this.openSpellModal(spell); }} style={{ cursor: 'pointer', color: nameColor }}>
                                        {spell.name}
                                    </a>
                                </strong>
                                <span style={{ color: '#7a7a7a' }}> — {levelText}{classes ? ` • ${classes}` : ''}</span>
                            </div>
                            {Number.isFinite(cap) && (
                                <div style={{ color: '#7a7a7a', fontSize: '0.8rem', marginLeft: 8 }}>
                                    {selectedAtLevel}/{cap}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    }

    renderSpells(level: number) {
        const { class: characterClass } = this.props;
        const classKey = characterClass.text.toLowerCase();
        const classSpells = this.state.spells.filter(spell =>
            Array.isArray(spell.classes) && spell.classes.includes(classKey) && this.getSpellLevel(spell) === level
        );

        const cap = this.getLevelCapacity(level);
        const selectedAtLevel = this.props.selectedSpells.filter(s => (s.level ?? 0) === level).length;
        const atCap = selectedAtLevel >= cap;

        return (
            <div>
                {classSpells.map(spell => {
                    const isChecked = this.props.selectedSpells.some(s => s.name === spell.name);
                    const disabled = !isChecked && atCap;
                    const desc: string = String(spell.description || '');
                    const short = desc.length > 220 ? desc.slice(0, 217) + '…' : desc;
                    const nameColor = isChecked ? '#3273dc' : (disabled ? '#b5b5b5' : '#0a0a0a');
                    const descColor = disabled ? '#9a9a9a' : '#4a4a4a';
                    return (
                        <div key={spell.name} style={{ marginBottom: '0.5rem' }}>
                            <label>
                                <input
                                    type="checkbox"
                                    onChange={() => this.handleSpellSelection(spell, level)}
                                    checked={isChecked}
                                    disabled={disabled}
                                    style={{ marginRight: 8 }}
                                />
                                <strong>
                                    <a onClick={(e) => { e.preventDefault(); this.openSpellModal(spell); }} style={{ cursor: 'pointer', color: nameColor }}>
                                        {spell.name}
                                    </a>
                                </strong>
                            </label>
                            {short && (
                                <div style={{ fontSize: '0.85rem', color: descColor, marginLeft: 26 }}>
                                    {short}
                                </div>
                            )}
                        </div>
                    );
                })}
                {Number.isFinite(cap) && (
                    <div style={{ fontSize: '0.85rem', color: '#7a7a7a' }}>
                        Selected: {selectedAtLevel}/{cap}
                    </div>
                )}
                {this.renderSpellModal()}
            </div>
        );
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
                <div className='field has-addons' style={{ marginBottom: '1rem' }}>
                    <div className='control is-expanded'>
                        <input
                            className='input'
                            type='text'
                            placeholder='Search spells (any class) — min 2 chars'
                            value={this.state.searchQuery}
                            onChange={this.handleSearchChange}
                        />
                    </div>
                    <div className='control'>
                        <button className='button' onClick={() => this.setState({ searchQuery: '' })}>Clear</button>
                    </div>
                </div>
                {this.renderSearchResults()}
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
                        const cap = this.getLevelCapacity(spellLevel);
                        const selectedAtLevel = this.props.selectedSpells.filter(s => (s.level ?? 0) === spellLevel).length;
                        return (
                            <div key={spellLevel}>
                                <label className='label'>
                                    Level {spellLevel} Spells ({slots} slots)
                                    {Number.isFinite(cap) && ` — Selected ${selectedAtLevel}/${cap}`}
                                </label>
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