import { 
  ScheduleSchema, 
  AvailabilitySchema, 
  WarningsSchema, 
  TalkSchema,
  Talk,
  Schedule,
  Availability,
  Warnings
} from './schemas';
import moment, { type Moment } from 'moment';

const basePath = process.env.BASE_PATH || '';

function getOrgaEventBase() {
  if (typeof window === 'undefined') return '';
  const isShifts = isShiftsMode();
  const modePrefix = isShifts ? '/teamshifts' : '/orga';
  const match = window.location.pathname.match(/\/event\/([^/]+)\/([^/]+)/);
  if (!match) {
    throw new Error(`Schedule editor must be loaded under ${modePrefix}/event/<organizer>/<event>/`);
  }
  return `${basePath}${modePrefix}/event/${match[1]}/${match[2]}`;
}

export function isShiftsMode(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.pathname.includes('/teamshifts/');
}

const calculateDuration = (start?: string, end?: string): number | undefined => {
  if (!start || !end) return undefined;
  try {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    return (endTime - startTime) / (1000 * 60);
  } catch {
    return undefined;
  }
};

interface TalkPayload {
  id?: number;
  code?: string;
  title?: string | Record<string, string>;
  description?: string | Record<string, string>;
  room?: string | number | { id: string | number };
  start?: string;
  end?: string;
  duration?: number;
  role?: string | number;
  capacity?: number;
  roles?: { id: string | number; capacity: number }[];
}

// Define specific types for HTTP request bodies
type HttpRequestBody = Record<string, unknown> | string | null;

interface MembersResponse {
  members: { id: number; name: string; email: string }[];
}

interface AssignmentResponse {
  status: string;
}

const api = {
  getOrgaEventBase,
  get organizerSlug() {
    if (typeof window === 'undefined') return null;
    const match = window.location.pathname.match(/\/event\/([^/]+)\/([^/]+)/);
    return match ? match[1] : null;
  },
  
  get eventSlug() {
    if (typeof window === 'undefined') return null;
    const match = window.location.pathname.match(/\/event\/([^/]+)\/([^/]+)/);
    return match ? match[2] : null;
  },
  
  async http<T>(verb: string, url: string, body: HttpRequestBody): Promise<T> {
    const headers: Record<string, string> = {};
    if (body) headers['Content-Type'] = 'application/json';

    const options: RequestInit = {
      method: verb,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
    };
    
    const response = await fetch(url, options);
    
    if (response.status === 204) {
      return undefined as unknown as T;
    }
    
    const json = await response.json();
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${JSON.stringify(json)}`);
    }
    
    return json as T;
  },

  async fetchTalks(options?: { since?: string; warnings?: boolean }): Promise<Schedule> {
    const endpoint = isShiftsMode() ? '/schedule/api/shifts/' : '/schedule/api/talks/';
    let url = `${getOrgaEventBase()}${endpoint}`;
    const params = new URLSearchParams(window.location.search);
    if (options?.since) params.append('since', options.since);
    if (options?.warnings) params.append('warnings', 'true');
    const paramsString = params.toString();
    if (paramsString) {
      url += `?${paramsString}`;
    }
    
    const data = await this.http<Schedule>('GET', url, null);
    return ScheduleSchema.parse(data);
  },

  async fetchAvailabilities(): Promise<Availability> {
    const url = `${getOrgaEventBase()}/schedule/api/availabilities/`;
    const data = await this.http<Availability>('GET', url, null);
    return AvailabilitySchema.parse(data);
  },

  async fetchWarnings(): Promise<Warnings> {
    const url = `${getOrgaEventBase()}/schedule/api/warnings/`;
    const data = await this.http<Warnings>('GET', url, null);
    return WarningsSchema.parse(data);
  },

  async saveTalk(talk: TalkPayload,{ action = 'PATCH' }: { action?: string } = {}): Promise<Talk | void> {
    const endpoint = isShiftsMode() ? '/schedule/api/shifts/' : '/schedule/api/talks/';
    const talksBase = `${getOrgaEventBase()}${endpoint}`;
    const urlPath = talk.id ? `${talksBase}${talk.id}/` : talksBase;
    const params = new URLSearchParams(window.location.search);
    const url = params.toString() ? `${urlPath}?${params.toString()}` : urlPath;

    let payload: HttpRequestBody = null;
    if (action !== 'DELETE') {
      const roomId = typeof talk.room === 'object' ? talk.room.id : talk.room;
      const duration = talk.duration ?? calculateDuration(talk.start, talk.end);
      
      // RESTORED UTC CONVERSION - same as original JS version
      const convertToUTC = (date: string | Moment | undefined): string | undefined => {
        if (!date) return undefined;
        return typeof date === 'string' 
          ? moment(date).utc().format()
          : date.utc().format();
      };
      
      payload = {
        room: roomId,
        start: convertToUTC(talk.start),
        end: convertToUTC(talk.end),
        duration,
        title: talk.title,
        description: talk.description,
      };
      
      if (isShiftsMode()) {
        payload.roles = talk.roles;
      }
    }
    
    const response = await this.http<Talk>(action, url, payload);
    
    if (action !== 'DELETE') {
      return TalkSchema.parse(response);
    }
  },

  async deleteTalk(talk: { id: number }): Promise<void> {
    await this.saveTalk({ id: talk.id }, { action: 'DELETE' });
  },

  async createTalk(talk: Omit<TalkPayload, 'id'>): Promise<Talk> {
    const response = await this.saveTalk(talk, { action: 'POST' });
    if (!response) {
      throw new Error('Failed to create talk: No response from server');
    }
    return response;
  },

  async fetchMembers(roleId: number): Promise<MembersResponse> {
    const url = `${getOrgaEventBase()}/schedule/api/members/?role=${roleId}`;
    return this.http<MembersResponse>('GET', url, null);
  },

  async assignMember(shiftId: number, roleId: number, userId: number): Promise<AssignmentResponse> {
    const url = `${getOrgaEventBase()}/schedule/api/assignments/`;
    return this.http<AssignmentResponse>('POST', url, { shift_id: shiftId, role_id: roleId, user_id: userId });
  },

  async unassignMember(shiftId: number, roleId: number, userId: number): Promise<AssignmentResponse> {
    const url = `${getOrgaEventBase()}/schedule/api/assignments/?shift_id=${shiftId}&role_id=${roleId}&user_id=${userId}`;
    return this.http<AssignmentResponse>('DELETE', url, null);
  },
};

export default api
