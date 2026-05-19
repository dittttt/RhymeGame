// Standard Elo math, K-factor 32. Pure functions for easy testing.

export const K_FACTOR = 32;
export const DEFAULT_ELO = 1000;

/** Expected score for player A against a single opponent B. */
export function expectedScore(myElo: number, oppElo: number): number {
  return 1 / (1 + Math.pow(10, (oppElo - myElo) / 400));
}

/**
 * Compute the Elo delta for one player in a multi-player free-for-all round
 * by averaging pairwise updates against every other player.
 * - `myElo` and `oppElos` are the *current* ratings of every entrant.
 * - `won` is true iff this player is the round winner.
 * For a winner-takes-all round: score=1 against everyone else, opponents score=0
 * against the winner and 1/(n-1) implicit when paired against each other (we
 * pair each non-winner against the winner only, which is the standard FFA
 * simplification and gives a tidy, symmetric ledger).
 */
export function ffaDelta(
  myElo: number,
  oppElos: number[],
  won: boolean,
  k: number = K_FACTOR,
): number {
  if (oppElos.length === 0) return 0;
  let sum = 0;
  for (const opp of oppElos) {
    const expected = expectedScore(myElo, opp);
    const actual = won ? 1 : 0;
    sum += k * (actual - expected);
  }
  return Math.round(sum / oppElos.length);
}

export type EloRoundInput = {
  userId: string;
  elo: number;
};

export type EloRoundResult = {
  userId: string;
  eloBefore: number;
  eloAfter: number;
  delta: number;
};

/** Compute deltas for every player given the winner. */
export function computeRoundDeltas(
  players: EloRoundInput[],
  winnerId: string,
  k: number = K_FACTOR,
): EloRoundResult[] {
  return players.map((p) => {
    const oppElos = players.filter((o) => o.userId !== p.userId).map((o) => o.elo);
    const delta = ffaDelta(p.elo, oppElos, p.userId === winnerId, k);
    return {
      userId: p.userId,
      eloBefore: p.elo,
      eloAfter: p.elo + delta,
      delta,
    };
  });
}
