export function calculateChemistry(players) {
  const clubs = {};
  const leagues = {};
  const nations = {};

  const norm = str => (str ? str.trim().toLowerCase() : '');

  players.flat().forEach(p => {
    if (!p) return;
    if (p.club) {
      const key = norm(p.club);
      clubs[key] = (clubs[key] || 0) + 1;
    }
    if (p.league) {
      const key = norm(p.league);
      leagues[key] = (leagues[key] || 0) + 1;
    }
    if (p.nationality) {
      const key = norm(p.nationality);
      nations[key] = (nations[key] || 0) + 1;
    }
  });

  // Chemistry rules based on counts of matching attributes
  const clubContribution = count => {
    if (count >= 7) return 3; // 7+ players from same club
    if (count >= 4) return 2; // 4-6 players from same club
    if (count >= 2) return 1; // exactly 2 or 3 players from same club
    return 0;
  };

  const leagueContribution = count => {
    if (count >= 8) return 3; // 8+ players from same league
    if (count >= 5) return 2; // 5-7 players from same league
    if (count >= 3) return 1; // exactly 3 or 4 players from same league
    return 0;
  };

  const nationContribution = count => {
    if (count >= 8) return 3; // 8+ players from same nationality
    if (count >= 5) return 2; // 5-7 players from same nationality
    if (count >= 2) return 1; // exactly 2 to 4 players from same nationality
    return 0;
  };

  return players.map(row =>
    row.map(p => {
      if (!p) return 0;
      const clubKey = norm(p.club);
      const leagueKey = norm(p.league);
      const nationKey = norm(p.nationality);
      const chem =
        clubContribution(clubs[clubKey] || 0) +
        leagueContribution(leagues[leagueKey] || 0) +
        nationContribution(nations[nationKey] || 0);
      return Math.min(3, chem);
    })
  );
}
