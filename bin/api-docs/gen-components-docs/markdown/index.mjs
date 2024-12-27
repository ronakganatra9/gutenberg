/**
 * External dependencies
 */
import json2md from 'json2md';

/**
 * Internal dependencies
 */
import { generateMarkdownPropsJson } from './props.mjs';

/**
 * Converter for strings that are already formatted as Markdown.
 *
 * @param {string} [input]
 * @return {string} The trimmed input if it is contentful, otherwise an empty string.
 */
json2md.converters.md = ( input ) => {
	return input?.trim() || '';
};

export function generateMarkdownDocs( { typeDocs, subcomponentTypeDocs } ) {
	const mainDocsJson = [
		{ h1: typeDocs.displayName },
		'<!-- This file is generated automatically and cannot be edited directly. Make edits via TypeScript types and TSDocs. -->',
		{
			p: `<p class="callout callout-info">See the <a href="https://wordpress.github.io/gutenberg/?path=/docs/components-${ typeDocs.displayName.toLowerCase() }--docs">WordPress Storybook</a> for more detailed, interactive documentation.</p>`,
		},
		{ md: typeDocs.description },
		...generateMarkdownPropsJson( typeDocs.props ),
	];

	const subcomponentDocsJson = subcomponentTypeDocs?.length
		? [
				{ h2: 'Subcomponents' },
				...subcomponentTypeDocs.flatMap( ( subcomponentTypeDoc ) => [
					{
						h3: subcomponentTypeDoc.displayName,
					},
					{ md: subcomponentTypeDoc.description },
					...generateMarkdownPropsJson( subcomponentTypeDoc.props, {
						headingLevel: 4,
					} ),
				] ),
		  ]
		: [];

	return json2md(
		[ ...mainDocsJson, ...subcomponentDocsJson ].filter( Boolean )
	).replace( /\n+$/gm, '\n' ); // clean unnecessary consecutive newlines
}
