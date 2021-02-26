<!--
  - @copyright Copyright (c) 2019 Julius Härtl <jus@bitgrid.net>
  -
  - @author Julius Härtl <jus@bitgrid.net>
  - @author Robin Windey <ro.windey@gmail.com>
  -
  - @license GNU AGPL version 3 or any later version
  -
  - This program is free software: you can redistribute it and/or modify
  - it under the terms of the GNU Affero General Public License as
  - published by the Free Software Foundation, either version 3 of the
  - License, or (at your option) any later version.
  -
  - This program is distributed in the hope that it will be useful,
  - but WITHOUT ANY WARRANTY; without even the implied warranty of
  - MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
  - GNU Affero General Public License for more details.
  -
  - You should have received a copy of the GNU Affero General Public License
  - along with this program. If not, see <http://www.gnu.org/licenses/>.
  -
  -->

<template>
	<div>
		<Multiselect
			:value="currentValue"
			:placeholder="t('workflowengine', 'Select a file type')"
			label="label"
			track-by="pattern"
			:options="options"
			:multiple="false"
			:tagging="false"
			@input="setValue">
			<template slot="singleLabel" slot-scope="props">
				<span v-if="props.option.icon" class="option__icon" :class="props.option.icon" />
				<img v-else :src="props.option.iconUrl">
				<span class="option__title option__title_single">{{ props.option.label }}</span>
			</template>
			<template slot="option" slot-scope="props">
				<span v-if="props.option.icon" class="option__icon" :class="props.option.icon" />
				<img v-else :src="props.option.iconUrl">
				<span class="option__title">{{ props.option.label }}</span>
			</template>
		</Multiselect>
		<input v-if="!isPredefined"
			type="text"
			:value="currentValue.pattern"
			:placeholder="t('workflowengine', 'e.g. httpd/unix-directory')"
			@input="updateCustom">
	</div>
</template>

<script>
import Multiselect from '@nextcloud/vue/dist/Components/Multiselect'
import valueMixin from './../../mixins/valueMixin'
import { imagePath } from '@nextcloud/router'

export default {
	name: 'FileMimeType',
	components: {
		Multiselect,
	},
	mixins: [
		valueMixin,
	],
	props: {
		comparatorIsRegex: {
			type: Boolean,
			required: true,
		},
	},
	data() {
		return {
			types: [
				{
					icon: 'icon-folder',
					label: t('workflowengine', 'Folder'),
					pattern: 'httpd/unix-directory',
					isRegex: false,
				},
				{
					icon: 'icon-picture',
					label: t('workflowengine', 'Images'),
					pattern: '/image\\/.*/',
					isRegex: true,
				},
				{
					iconUrl: imagePath('core', 'filetypes/x-office-document'),
					label: t('workflowengine', 'Office documents'),
					pattern: '/(vnd\\.(ms-|openxmlformats-|oasis\\.opendocument).*)$/',
					isRegex: true,
				},
				{
					iconUrl: imagePath('core', 'filetypes/application-pdf'),
					label: t('workflowengine', 'PDF documents'),
					pattern: 'application/pdf',
					isRegex: false,
				},
				{
					icon: 'icon-settings-dark',
					label: t('workflowengine', 'Custom mimetype'),
					pattern: '',
					isRegex: false,
					isCustom: true,
				},
			],
		}
	},
	computed: {
		options() {
			return this.types.filter((type) => type.isRegex === this.comparatorIsRegex)
		},
		isPredefined() {
			return !this.currentValue.isCustom
		},
		customValue() {
			return this.types.find((type) => type.isCustom)
		},
		currentValue() {
			// If we've no matching value the comparator must have changed
			// so reset file type to the first entry
			return this.options.find((type) => this.newValue === type.pattern) ?? this.options[0]
		},
	},
	methods: {
		validateRegex(string) {
			const regexRegex = /^\/(.*)\/([gui]{0,3})$/
			const result = regexRegex.exec(string)
			return result !== null
		},
		setValue(value) {
			if (value !== null) {
				this.newValue = value.pattern
				this.$emit('input', this.newValue)
			}
		},
		updateCustom(event) {
			const customPattern = event.target.value
			// Important: write the new input into the custom entry pattern
			// so that it can be found (pattern is our key to match entries)
			this.customValue.pattern = customPattern
			this.newValue = customPattern
			this.$emit('input', customPattern)
		},
	},
}
</script>
<style scoped>
	.multiselect, input[type='text'] {
		width: 100%;
	}
	.multiselect >>> .multiselect__content-wrapper li>span,
	.multiselect >>> .multiselect__single {
		display: flex;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>
