<!--
  - SPDX-FileCopyrightText: 2019 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->
<template>
	<div>
		<NcSelect
			:model-value="currentValue"
			:placeholder="t('workflowengine', 'Select a file type')"
			label="label"
			:options="options"
			:clearable="false"
			@input="setValue">
			<template #option="option">
				<span v-if="option.icon" class="option__icon" :class="option.icon" />
				<span v-else class="option__icon-img">
					<img :src="option.iconUrl" alt="">
				</span>
				<span class="option__title">
					<NcEllipsisedOption :name="String(option.label)" />
				</span>
			</template>
			<template #selected-option="selectedOption">
				<span v-if="selectedOption.icon" class="option__icon" :class="selectedOption.icon" />
				<span v-else class="option__icon-img">
					<img :src="selectedOption.iconUrl" alt="">
				</span>
				<span class="option__title">
					<NcEllipsisedOption :name="String(selectedOption.label)" />
				</span>
			</template>
		</NcSelect>
		<input
			v-if="!isPredefined"
			:value="currentValue.id"
			type="text"
			:placeholder="customPlaceholder"
			@input="updateCustom">
	</div>
</template>

<script>
import { imagePath } from '@nextcloud/router'
import NcEllipsisedOption from '@nextcloud/vue/components/NcEllipsisedOption'
import NcSelect from '@nextcloud/vue/components/NcSelect'
import { validateRegex } from '../../helpers/validators.js'

/**
 * Convert a plain MIME type into an anchored regular expression,
 * e.g. "my/mimetype" becomes "/^my\/mimetype$/"
 *
 * @param {string} mimeType plain MIME type
 */
function mimeTypeToRegex(mimeType) {
	return `/^${mimeType.replace(/[/\\^$.|?*+()[\]{}]/g, '\\$&')}$/`
}

/**
 * Invert mimeTypeToRegex, returns null if the given value
 * is not a regular expression built from a plain MIME type
 *
 * @param {string} value the check value
 */
function mimeTypeFromRegex(value) {
	const result = /^\/\^(.*)\$\/$/.exec(value)
	if (result === null) {
		return null
	}
	const mimeType = result[1].replace(/\\(.)/g, '$1')
	return mimeTypeToRegex(mimeType) === value ? mimeType : null
}

export default {
	name: 'FileMimeType',
	components: {
		NcEllipsisedOption,
		NcSelect,
	},

	props: {
		modelValue: {
			type: String,
			default: '',
		},

		operator: {
			type: String,
			default: '',
		},
	},

	emits: ['update:model-value'],

	data() {
		return {
			predefinedTypes: [
				{
					iconUrl: imagePath('core', 'filetypes/audio'),
					label: t('workflowengine', 'Audio'),
					id: '/audio\\/.*/',
				},
				{
					icon: 'icon-folder',
					label: t('workflowengine', 'Folder'),
					id: '/^httpd\\/unix-directory$/',
				},
				{
					icon: 'icon-picture',
					label: t('workflowengine', 'Images'),
					id: '/image\\/.*/',
				},
				{
					iconUrl: imagePath('core', 'filetypes/x-office-document'),
					label: t('workflowengine', 'Office documents'),
					id: '/(vnd\\.(ms-|openxmlformats-|oasis\\.opendocument).*)$/',
				},
				{
					iconUrl: imagePath('core', 'filetypes/application-pdf'),
					label: t('workflowengine', 'PDF documents'),
					id: '/^application\\/pdf$/',
				},
				{
					iconUrl: imagePath('core', 'filetypes/video'),
					label: t('workflowengine', 'Video'),
					id: '/video\\/.*/',
				},
			],

			customMimeTypeOption: {
				icon: 'icon-settings-dark',
				label: t('workflowengine', 'Custom MIME type'),
			},

			customRegexOption: {
				icon: 'icon-settings-dark',
				label: t('workflowengine', 'Custom regex'),
			},

			selectedCustomOption: null,
			newValue: '',
		}
	},

	computed: {
		options() {
			return [...this.predefinedTypes, this.customMimeTypeOption, this.customRegexOption]
		},

		isPredefined() {
			return this.predefinedTypes.some((type) => this.newValue === type.id)
		},

		hasRegexOperator() {
			return this.operator === 'matches' || this.operator === '!matches'
		},

		isCustomRegex() {
			if (this.selectedCustomOption !== null) {
				return this.selectedCustomOption === this.customRegexOption
			}
			return validateRegex(this.newValue) && mimeTypeFromRegex(this.newValue) === null
		},

		customPlaceholder() {
			if (this.isCustomRegex) {
				return t('workflowengine', 'e.g. /^application\\/xml$/')
			}
			return t('workflowengine', 'e.g. httpd/unix-directory')
		},

		currentValue() {
			const matchingPredefined = this.predefinedTypes.find((type) => this.newValue === type.id)
			if (matchingPredefined) {
				return matchingPredefined
			}
			if (this.isCustomRegex) {
				return { ...this.customRegexOption, id: this.newValue }
			}
			return { ...this.customMimeTypeOption, id: mimeTypeFromRegex(this.newValue) ?? this.newValue }
		},
	},

	watch: {
		modelValue() {
			this.updateInternalValue()
		},

		// Plain MIME type values stored by previous versions need to become
		// regular expressions once the legacy is/!is operator is switched to matches/!matches
		operator(newOperator, oldOperator) {
			if ((oldOperator === 'is' || oldOperator === '!is')
				&& this.hasRegexOperator
				&& !this.isPredefined
				&& !this.isCustomRegex
				&& this.newValue !== '') {
				this.newValue = mimeTypeToRegex(this.newValue)
				this.$emit('update:model-value', this.newValue)
			}
		},
	},

	methods: {
		updateInternalValue() {
			this.newValue = this.modelValue
		},

		setValue(value) {
			if (value === null) {
				return
			}
			if (value === this.customMimeTypeOption || value === this.customRegexOption) {
				this.selectedCustomOption = value
				this.newValue = ''
			} else {
				this.selectedCustomOption = null
				this.newValue = value.id
			}
			this.$emit('update:model-value', this.newValue)
		},

		updateCustom(event) {
			const input = event.target.value ?? event.detail?.[0] ?? ''
			if (input !== '' && !this.isCustomRegex && this.hasRegexOperator) {
				this.newValue = mimeTypeToRegex(input)
			} else {
				this.newValue = input
			}
			this.$emit('update:model-value', this.newValue)
		},
	},
}
</script>

<style scoped lang="scss">
.v-select,
input[type='text'] {
	width: 100%;
}

input[type=text] {
	min-height: 48px;
}

.option__icon,
.option__icon-img {
	display: inline-block;
	min-width: 30px;
	background-position: center;
	vertical-align: middle;
}

.option__icon-img {
	text-align: center;
}

.option__title {
	display: inline-flex;
	width: calc(100% - 36px);
	vertical-align: middle;
}
</style>
