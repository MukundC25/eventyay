/**
 * TeamShifts adapter for the public schedule web component.
 *
 * Provides capability flags and utility functions so the Session.vue
 * component can render shift role cards without polluting the standard
 * talk-rendering logic.
 */

/**
 * Resolve mode from the schedule data payload.
 * If the schedule data contains a `mode` field set to 'shifts', the
 * widget is displaying a shift schedule.
 *
 * @param {Object|null} scheduleData
 * @returns {'talks'|'shifts'}
 */
export function resolveMode (scheduleData) {
	if (scheduleData && scheduleData.mode === 'shifts') return 'shifts'
	return 'talks'
}

/**
 * Get capability flags for the given mode.
 *
 * @param {'talks'|'shifts'} mode
 * @returns {{ showRoles: boolean, showSpeakers: boolean, showTracks: boolean, showClaimUI: boolean }}
 */
export function getCapabilities (mode) {
	if (mode === 'shifts') {
		return {
			showRoles: true,
			showSpeakers: false,
			showTracks: false,
			showClaimUI: true,
		}
	}
	return {
		showRoles: false,
		showSpeakers: true,
		showTracks: true,
		showClaimUI: false,
	}
}

export function isShiftSchedule (scheduleData) {
	const data = scheduleData?.value ?? scheduleData
	return data?.mode === 'shifts' || data?.schedule?.mode === 'shifts'
}

/**
 * Determine if a session is a shift (has roles array).
 *
 * @param {{ roles?: Array|null }} session
 * @returns {boolean}
 */
export function isShiftSession (session) {
	return Array.isArray(session?.roles) && session.roles.length > 0
}

export function getAssignedList (role) {
	if (!role) return []
	if (Array.isArray(role.assigned)) return role.assigned
	if (Array.isArray(role.assigned_names)) {
		return role.assigned_names.map((name, i) => ({ id: i, name }))
	}
	return []
}

/**
 * Get capacity status class for a shift role.
 *
 * @param {{ capacity: number, assigned_count: number }} role
 * @returns {'open'|'partial'|'full'}
 */
export function getCapacityStatus (role) {
	const assigned = getAssignedList(role)
	const capacity = role?.capacity || 0
	if (capacity && assigned.length >= capacity) return 'full'
	if (assigned.length > 0) return 'partial'
	return 'empty'
}

export function getCurrentUserId (scheduleData) {
	return scheduleData?.schedule?.current_user_id ?? scheduleData?.current_user_id ?? null
}

export function getCurrentUserName (scheduleData) {
	return scheduleData?.schedule?.current_user_name || scheduleData?.current_user_name || ''
}

export function getShiftId (session) {
	if (session?.talkId != null) return session.talkId
	const raw = session?.id
	const parsed = Number.parseInt(raw, 10)
	return Number.isNaN(parsed) ? raw : parsed
}

export function claimUrl (eventUrl, session, role) {
	const base = (eventUrl || '').replace(/\/?$/, '/')
	return `${base}teamshifts/shifts/${getShiftId(session)}/claim/`
}

export function withdrawUrl (eventUrl, session, role) {
	const base = (eventUrl || '').replace(/\/?$/, '/')
	return `${base}teamshifts/shifts/${getShiftId(session)}/withdraw/`
}
