import { actions, type Action, type PublicWorld } from '../../packages/shared/world';

const catalogue = {
  wander: {
    title: 'Wander',
    description: 'Find a new corner of the common room.',
    needs: 'A clear route and an unoccupied destination.',
    motion: 'Relaxed steps, gentle turns, and a pause on arrival.',
  },
  rest: {
    title: 'Rest',
    description: 'Recover energy in a quiet spot.',
    needs: 'A free seat or a place beside the hearth.',
    motion: 'Sit down, breathe quietly, then stand up before leaving. Fireside rest can be standing.',
  },
  drink: {
    title: 'Drink',
    description: 'Enjoy a serving of amber ale.',
    needs: 'Reach the bar with at least one coin while ale is in stock.',
    motion: 'Lift a mug, take a sip, and pause between drinks. Borin serves from behind the counter.',
  },
  chat: {
    title: 'Converse',
    description: 'Share a moment with another traveler.',
    needs: 'A nearby partner who is available.',
    motion: 'Face a companion and talk with relaxed full-body gestures.',
  },
  trade: {
    title: 'Trade',
    description: 'Exchange two coins for a restorative tonic.',
    needs: 'A nearby available seller with tonic and a buyer with two coins.',
    motion: 'Reach out for the exchange, then settle into conversation.',
  },
  play_music: {
    title: 'Make music',
    description: 'Give the evening a melody, alone or in a duet.',
    needs: 'Reach the stage with a lute or a singing voice.',
    motion: 'Hold and strum a lute, or gesture while singing. Sound is available through Enable sound.',
  },
  dance: {
    title: 'Dance',
    description: 'Move to a live performance.',
    needs: 'A musician must already be performing.',
    motion: 'A rhythmic full-body dance, with a different starting beat for each traveler.',
  },
  craft_instrument: {
    title: 'Craft a lute',
    description: 'Turn a workshop kit into a lasting instrument.',
    needs:
      'An apprentice without an instrument, three pieces of wood, one set of strings, enough energy, and twelve seconds at the bench.',
    motion: 'Kneel and work with a hand-held hammer before returning to the room.',
  },
} satisfies Record<Action, { title: string; description: string; needs: string; motion: string }>;

export function ActionCatalogue({
  world,
  online,
  follow,
}: {
  world: PublicWorld | null;
  online: boolean;
  follow(id: string): void;
}) {
  return (
    <section className="action-catalogue" aria-label="Traveler actions" data-world-version={world?.version}>
      <div className="section-title">
        <h2>Life in the tavern</h2>
        <span>{online ? 'LIVE ACTIVITY' : 'LAST CONFIRMED ACTIVITY'}</span>
      </div>
      <p className="quiet">
        Eight ways to spend an evening. Open an activity to see its movements and follow a traveler.
      </p>
      {!world ? (
        <p className="quiet">Waiting for the travelers…</p>
      ) : (
        actions.map((action, index) => {
          const entry = catalogue[action];
          const participants = world.inhabitants.filter(
            (npc) => npc.action === action && npc.phase !== 'idle',
          );
          const active = participants.filter((npc) => npc.phase === 'performing').length;
          const approaching = participants.length - active;
          return (
            <details
              className="action-card"
              key={action}
              data-action={action}
              data-active={active}
              data-approaching={approaching}
            >
              <summary>
                <span className="action-number" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="action-heading">
                  <strong>{entry.title}</strong>
                  <small>
                    {active ? `${active} active` : 'Quiet for now'}
                    {approaching ? ` · ${approaching} on the way` : ''}
                  </small>
                </span>
              </summary>
              <div className="action-body">
                <p>{entry.description}</p>
                <dl>
                  <dt>What it takes</dt>
                  <dd>{entry.needs}</dd>
                  <dt>How it moves</dt>
                  <dd>{entry.motion}</dd>
                </dl>
                {participants.length ? (
                  <div
                    className="action-travelers"
                    aria-label={`Travelers choosing to ${entry.title.toLowerCase()}`}
                  >
                    {participants.map((npc) => (
                      <button key={npc.id} onClick={() => follow(npc.id)} aria-label={`Watch ${npc.name}`}>
                        <span className="action-dot" style={{ background: npc.color }} aria-hidden="true" />
                        <span>
                          {npc.name}
                          <small>{npc.phase === 'walking' ? 'On the way' : 'Doing this now'}</small>
                        </span>
                        <span aria-hidden="true">↗</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="quiet">
                    No one is choosing this activity right now. Travelers decide for themselves.
                  </p>
                )}
              </div>
            </details>
          );
        })
      )}
    </section>
  );
}
