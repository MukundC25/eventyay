<template lang="pug">
dialog.pretalx-modal.assign-volunteer-modal(ref="modal", :aria-labelledby="titleId", @click="onBackdrop", @cancel.prevent="cancel")
	.dialog-inner(@click.stop="")
		h3.assign-volunteer-title
			span(:id="titleId") {{ $t('Assign volunteers') }}
			button.modal-close-btn(type="button", aria-label="Close dialog", @click="cancel") ✕
		p.assign-volunteer-error(v-if="error") {{ error }}
		.assign-role(v-if="role")
			h4 {{ getLocalizedString(role.name) }} ({{ assigned.length }}/{{ role.capacity }} {{ $t('assigned') }})
			div
				span.member-chip(v-for="assignee in assigned", :key="assignee.id")
					| {{ assignee.name }}
					button.member-chip-remove(type="button", :disabled="busy", :aria-label="$t('Unassign')", :title="$t('Unassign')", @click="emit('unassign', { roleId: role.id, userId: assignee.id })") ✕
				p.text-muted(v-if="!assigned.length") {{ $t('No members assigned yet.') }}
			.assign-new
				select.form-control(v-model="selectedMemberId", :disabled="isFull", :aria-label="$t('Select a member')")
					option(value="") {{ $t('Select a member') }}
					option(v-for="member in assignableMembers", :key="member.id", :value="member.id") {{ member.name }}{{ member.email ? ` (${member.email})` : '' }}
				button.assign-btn(type="button", :disabled="busy || isFull || !selectedMemberId", @click="assign(selectedMemberId)") {{ $t('Assign') }}
			p.text-muted.assign-full(v-if="isFull") {{ $t('This role is full.') }}
		.button-row
			bunt-button#btn-close(type="button", :disabled="busy", @click="cancel") {{ $t('Close') }}
</template>

<script setup>
import { computed, ref, useId, watch } from 'vue'
import { getLocalizedString } from '../utils'
import { getAssignedList } from './index'

const props = defineProps({
	session: { type: Object, default: null },
	roleId: { type: Number, default: null },
	members: { type: Array, default: () => [] },
	error: { type: String, default: '' },
	busy: { type: Boolean, default: false },
})

const emit = defineEmits(['assign', 'unassign', 'cancel'])

const titleId = useId()
const modal = ref(null)
const selectedMemberId = ref('')

const role = computed(() => (props.session?.roles || []).find(r => r.id === props.roleId) || null)
const assigned = computed(() => getAssignedList(role.value))
const isFull = computed(() => {
	const capacity = Number(role.value?.capacity)
	if (!Number.isFinite(capacity)) return false
	return capacity <= 0 || assigned.value.length >= capacity
})
const assignableMembers = computed(() => props.members.filter(member => !assigned.value.some(user => user.id === member.id)))

watch(() => assigned.value.map(user => user.id), ids => {
	if (ids.includes(selectedMemberId.value)) selectedMemberId.value = ''
})

function show () {
	selectedMemberId.value = ''
	modal.value?.showModal?.()
}

function close () {
	if (modal.value?.open) modal.value.close()
}

function cancel () {
	close()
	emit('cancel')
}

function onBackdrop (event) {
	if (event.target === modal.value) cancel()
}

function assign (userId) {
	if (!userId || !role.value) return
	emit('assign', { roleId: role.value.id, userId })
}

defineExpose({ show, close })
</script>

<style lang="stylus">
.assign-volunteer-modal
	border: none
	padding: 0
	&::backdrop
		background-color: rgba(0, 0, 0, 0.5)
	.dialog-inner
		background-color: $clr-white
		border-radius: 4px
		padding: 32px 40px
		width: unquote("min(680px, 95vw)")
		max-height: calc(100vh - 48px)
		overflow-y: auto
		box-sizing: border-box
	.assign-volunteer-title
		font-size: 22px
		margin: 0 0 16px
		display: flex
		justify-content: space-between
		align-items: center
		.modal-close-btn
			background: none
			border: none
			font-size: 20px
			color: $clr-grey-600
			cursor: pointer
			padding: 4px 8px
			line-height: 1
			border-radius: 4px
			&:hover
				color: $clr-grey-900
				background-color: rgba(0, 0, 0, 0.05)
	.assign-volunteer-error
		display: flex
		align-items: center
		padding: 10px 14px
		margin-bottom: 16px
		background-color: #fdecea
		border: 1px solid #f5c6cb
		border-radius: 4px
		color: #721c24
		font-size: 14px
	.assign-role
		margin-bottom: 24px
		h4
			font-size: 15px
			font-weight: 600
			margin: 0 0 8px
			color: $clr-grey-700
		.text-muted
			font-size: 13px
			color: $clr-grey-600
			margin: 0
		.assign-full
			margin-top: 8px
	.member-chip
		display: inline-flex
		align-items: center
		gap: 6px
		background-color: $clr-grey-200
		color: $clr-primary-text-light
		border-radius: 14px
		padding: 4px 6px 4px 12px
		margin: 0 6px 6px 0
		font-size: 13px
		line-height: 1.4
		.member-chip-remove
			display: inline-flex
			align-items: center
			justify-content: center
			width: 18px
			height: 18px
			border: none
			border-radius: 50%
			background: none
			color: $clr-danger
			cursor: pointer
			padding: 0
			font-size: 11px
			&:hover
				background-color: rgba(0, 0, 0, 0.08)
			&:disabled
				opacity: 0.5
				cursor: default
	.assign-new
		display: flex
		align-items: center
		gap: 8px
		margin-top: 8px
		.form-control
			flex: auto
			font-size: 14px
			border: 1px solid $clr-grey-300
			border-radius: 4px
			padding: 8px 10px
			box-sizing: border-box
	.assign-btn
		flex: none
		min-height: 38px
		padding: 0 16px
		border: none
		border-radius: 4px
		background-color: $clr-primary
		color: $clr-white
		font-weight: bold
		cursor: pointer
		&:hover
			opacity: 0.9
		&:disabled
			opacity: 0.5
			cursor: default
	.button-row
		display: flex
		width: 100%
		margin-top: 8px
		gap: 8px
		.bunt-button-content
			font-size: 16px
		#btn-close
			margin-left: auto
			button-style(color: $clr-grey-200)
</style>
