import axios from 'axios';
import { POPULAR_LEAGUES, POPULAR_TEAMS, NATIONALITIES } from './defaultData';

// Base URL for the public sports database API.
const API_BASE = 'https://www.thesportsdb.com/api/v1/json/3';

/**
 * Get the list of leagues supported by the application.
 */
export async function getLeagues() {
  return POPULAR_LEAGUES;
}

/**
 * Get the list of common nationalities for filtering.
 */
export async function getNationalities() {
  return NATIONALITIES;
}

/**
 * Retrieve teams for a given league.
 * @param {string} league
 */
export async function getTeams(league) {
  return POPULAR_TEAMS[league] || [];
}

/**
 * Search players by name.
 * @param {string} query partial name
 * @returns {Promise<string[]>}
 */
export async function searchPlayers(query) {
  const resp = await axios.get(`${API_BASE}/searchplayers.php`, { params: { p: query } });
  const players = resp.data.player || [];
  return players.map(p => p.strPlayer).filter(Boolean);
}

/**
 * Fetch player details including nationality and club.
 * @param {string} name
 */
export async function getPlayerDetails(name) {
  const resp = await axios.get(`${API_BASE}/searchplayers.php`, { params: { p: name } });
  const list = resp.data.player || [];
  if (!list.length) {
    throw new Error('Player not found');
  }
  const lowered = name.toLowerCase();
  let player = list.find(p => (p.strPlayer || '').toLowerCase() === lowered) || list[0];
  let league = null;
  if (player.strTeam) {
    try {
      const teamResp = await axios.get(`${API_BASE}/searchteams.php`, { params: { t: player.strTeam } });
      const teamList = teamResp.data.teams || [];
      if (teamList.length) {
        league = teamList[0].strLeague;
      }
    } catch (e) {
      // ignore network errors
    }
  }
  return {
    name: player.strPlayer,
    nationality: player.strNationality,
    club: player.strTeam,
    league,
    photo: player.strCutout || player.strThumb || player.strRender,
  };
}
