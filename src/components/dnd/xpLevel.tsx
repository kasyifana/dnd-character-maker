import React from 'react';
import reference from '../../core/reference';

interface Props {
    xp: number;
    level: number;
    setXpAndLevel: (xp: number, level: number) => void;
}

export default class XpLevel extends React.Component<Props> {
    constructor(props: Props) {
        super(props);
        this.handleChange = this.handleChange.bind(this);
        this.handleLevelChange = this.handleLevelChange.bind(this);
    }

    handleChange(event: any) {
        const raw = event.target.value;
        const xp = Number(raw) || 0;
        this.props.setXpAndLevel(xp, this.getLevel(xp));
    }

    handleLevelChange(event: any) {
        let level = Number(event.target.value) || 1;
        // Clamp to 1..20 (standard 5e)
        level = Math.max(1, Math.min(20, level));
        const xp = this.getMinXpForLevel(level);
        this.props.setXpAndLevel(xp, level);
    }

    getLevel(xp: number): number {
        // Computed character level from XP
        if (xp === undefined)
            return 1;

        let lev = 0;
        for (let xpLevel of reference.xpLevels) {
            if (xp >= xpLevel.xp)
                lev++;
            else
                break;
        }

        return lev;
    };

    getMinXpForLevel(level: number): number {
        if (!level || level < 1) return 0;
        const idx = Math.min(level, reference.xpLevels.length) - 1;
        return reference.xpLevels[idx].xp;
    }

    public render(): JSX.Element {
        const level = this.props.level;
        const xp = this.props.xp;

        return (
            <div className='field'>
                <div className='columns'>
                    <label className='column is-2 label'>Level:</label>
                    <input
                        className='input column is-1'
                        id="level"
                        type="number"
                        min={1}
                        max={20}
                        value={level}
                        onChange={this.handleLevelChange}
                    />
                </div>

                <div className='columns'>
                    <label className='column is-2 label'>XP:</label>
                    <input className='input column is-fullwidth' id="xp" type="number" name="xp" value={xp} onChange={this.handleChange} />
                </div>
            </div>
        )
    }
}