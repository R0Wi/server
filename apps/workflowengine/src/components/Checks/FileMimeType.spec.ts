/*
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { Wrapper } from '@vue/test-utils'

import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import FileMimeType from './FileMimeType.vue'

vi.stubGlobal('t', (app: string, text: string) => text)

/**
 * Mount the component and set the stored check value afterwards,
 * like Check.vue does at runtime.
 *
 * @param operator the check operator
 * @param modelValue the stored check value
 */
async function mountComponent(operator: string, modelValue = ''): Promise<Wrapper<any>> {
	const wrapper = mount(FileMimeType, {
		propsData: { operator },
		mocks: { t: (app: string, text: string) => text },
	})
	if (modelValue !== '') {
		await wrapper.setProps({ modelValue })
	}
	return wrapper
}

function lastEmittedValue(wrapper: Wrapper<any>): string {
	const emitted = wrapper.emitted('update:model-value')!
	return emitted[emitted.length - 1][0]
}

describe('FileMimeType.vue', () => {
	it('offers "Custom MIME type" and "Custom regex" as two separate options', async () => {
		const wrapper = await mountComponent('matches')

		const labels = wrapper.vm.options.map((option: { label: string }) => option.label)
		expect(labels).toContain('Custom MIME type')
		expect(labels).toContain('Custom regex')
	})

	it('converts a custom MIME type into a regular expression', async () => {
		const wrapper = await mountComponent('matches')
		await wrapper.vm.setValue(wrapper.vm.customMimeTypeOption)

		await wrapper.find('input[type="text"]').setValue('my/mime.type+x')

		expect(lastEmittedValue(wrapper)).toBe('/^my\\/mime\\.type\\+x$/')
	})

	it('displays a converted regular expression as plain MIME type', async () => {
		const wrapper = await mountComponent('matches', '/^image\\/png$/')

		expect(wrapper.vm.currentValue.label).toBe('Custom MIME type')
		expect((wrapper.find('input[type="text"]').element as HTMLInputElement).value).toBe('image/png')
	})

	it('displays any other regular expression as custom regex', async () => {
		const wrapper = await mountComponent('matches', '/^(image|video)\\/.+$/')

		expect(wrapper.vm.currentValue.label).toBe('Custom regex')
		expect((wrapper.find('input[type="text"]').element as HTMLInputElement).value).toBe('/^(image|video)\\/.+$/')
	})

	it('keeps a custom regex as-is', async () => {
		const wrapper = await mountComponent('matches')
		await wrapper.vm.setValue(wrapper.vm.customRegexOption)

		expect(lastEmittedValue(wrapper)).toBe('')
		expect(wrapper.vm.currentValue.label).toBe('Custom regex')

		await wrapper.find('input[type="text"]').setValue('/^font\\//')

		expect(lastEmittedValue(wrapper)).toBe('/^font\\//')
	})

	it('displays a predefined type without the custom input', async () => {
		const wrapper = await mountComponent('matches', '/audio\\/.*/')

		expect(wrapper.vm.currentValue.label).toBe('Audio')
		expect(wrapper.find('input[type="text"]').exists()).toBe(false)
	})

	it('emits the predefined id when a predefined type is selected', async () => {
		const wrapper = await mountComponent('matches')
		const folder = wrapper.vm.predefinedTypes.find((type: { label: string }) => type.label === 'Folder')

		await wrapper.vm.setValue(folder)

		expect(lastEmittedValue(wrapper)).toBe('/^httpd\\/unix-directory$/')
		expect(wrapper.find('input[type="text"]').exists()).toBe(false)
	})

	it('keeps plain MIME types of existing configurations with the legacy is operator', async () => {
		const wrapper = await mountComponent('is', 'application/pdf')

		expect(wrapper.vm.currentValue.label).toBe('Custom MIME type')
		expect((wrapper.find('input[type="text"]').element as HTMLInputElement).value).toBe('application/pdf')

		await wrapper.find('input[type="text"]').setValue('httpd/unix-directory')

		expect(lastEmittedValue(wrapper)).toBe('httpd/unix-directory')
	})

	it('converts a plain MIME type when switching from the legacy is operator to matches', async () => {
		const wrapper = await mountComponent('is', 'application/pdf')

		await wrapper.setProps({ operator: 'matches' })

		expect(lastEmittedValue(wrapper)).toBe('/^application\\/pdf$/')
	})
})

describe('FileMimeType check definition', () => {
	async function getMimeTypeCheck() {
		const { default: FileChecks } = await import('./file.js')
		return FileChecks.find((check: { class: string }) => check.class === 'OCA\\WorkflowEngine\\Check\\FileMimeType')
	}

	it('only offers the matches and does not match operators', async () => {
		const check = await getMimeTypeCheck()

		expect(check.operators({ operator: 'matches' }).map((operator: { operator: string }) => operator.operator))
			.toEqual(['matches', '!matches'])
	})

	it('keeps the legacy operator of existing configurations', async () => {
		const check = await getMimeTypeCheck()

		expect(check.operators({ operator: 'is' }).map((operator: { operator: string }) => operator.operator))
			.toEqual(['matches', '!matches', 'is'])
		expect(check.operators({ operator: '!is' }).map((operator: { operator: string }) => operator.operator))
			.toEqual(['matches', '!matches', '!is'])
	})

	it('validates the check value', async () => {
		const check = await getMimeTypeCheck()

		expect(check.validate({ operator: 'matches', value: '/^application\\/pdf$/' })).toBe(true)
		expect(check.validate({ operator: 'matches', value: 'application/pdf' })).toBe(false)
		expect(check.validate({ operator: 'is', value: 'application/pdf' })).toBe(true)
	})
})
