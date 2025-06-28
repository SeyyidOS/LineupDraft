export function calculateChemistry(players) {
  const clubs = {};
  const leagues = {};
  const nations = {};

  players.flat().forEach(p => {
    if (!p) return;
    if (p.club) clubs[p.club] = (clubs[p.club] || 0) + 1;
    if (p.league) leagues[p.league] = (leagues[p.league] || 0) + 1;
    if (p.nationality) nations[p.nationality] = (nations[p.nationality] || 0) + 1;
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
      const chem =
        clubContribution(clubs[p.club] || 0) +
        leagueContribution(leagues[p.league] || 0) +
        nationContribution(nations[p.nationality] || 0);
      return Math.min(3, chem);
    })
  );
}
