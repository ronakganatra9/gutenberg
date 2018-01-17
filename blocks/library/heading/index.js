/**
 * External dependencies
 */
import { first } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { concatChildren } from '@wordpress/element';
import { Toolbar } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './editor.scss';
import { registerBlockType, createBlock } from '../../api';
import Editable from '../../editable';
import BlockControls from '../../block-controls';
import InspectorControls from '../../inspector-controls';
import AlignmentToolbar from '../../alignment-toolbar';

registerBlockType( 'core/heading', {
	title: __( 'Heading' ),

	description: __( 'Search engines use the headings to index the structure and content of your web pages.' ),

	icon: 'heading',

	category: 'common',

	keywords: [ __( 'title' ), __( 'subtitle' ) ],

	supports: {
		className: false,
		anchor: true,
	},

	attributes: {
		content: {
			type: 'array',
			source: 'children',
			selector: 'h1,h2,h3,h4,h5,h6',
		},
		nodeName: {
			type: 'string',
			source: 'property',
			selector: 'h1,h2,h3,h4,h5,h6',
			property: 'nodeName',
			default: 'H2',
		},
		align: {
			type: 'string',
		},
		placeholder: {
			type: 'string',
		},
	},

	transforms: {
		from: [
			{
				type: 'block',
				blocks: [ 'core/paragraph' ],
				transform: ( { content } ) => {
					return createBlock( 'core/heading', {
						content,
					} );
				},
			},
			{
				type: 'raw',
				isMatch: ( node ) => /H\d/.test( node.nodeName ),
			},
			{
				type: 'pattern',
				regExp: /^(#{2,6})\s/,
				transform: ( { content, match } ) => {
					const level = match[ 1 ].length;

					return createBlock( 'core/heading', {
						nodeName: `H${ level }`,
						content,
					} );
				},
			},
			...'23456'.split( '' ).map( ( level ) => ( {
				type: 'shortcut',
				blocks: [ 'core/paragraph' ],
				shortcut: level,
				transform( blockAttributes ) {
					return blockAttributes.map( ( { content } ) => {
						return createBlock( 'core/heading', {
							nodeName: `H${ level }`,
							content,
						} );
					} );
				},
			} ) ),
		],
		to: [
			{
				type: 'block',
				blocks: [ 'core/paragraph' ],
				transform: ( { content } ) => {
					return createBlock( 'core/paragraph', {
						content,
					} );
				},
			},
			...'23456'.split( '' ).map( ( level ) => ( {
				type: 'shortcut',
				shortcut: level,
				transform( attributes ) {
					const firstNodeName = first( attributes ).nodeName;
					const isSame = attributes.every( ( { nodeName } ) => nodeName === firstNodeName );

					// If already at level, set back to paragraphs.
					if ( isSame && firstNodeName === `H${ level }` ) {
						return attributes.map( ( { content } ) => {
							return createBlock( 'core/paragraph', {
								content,
							} );
						} );
					}

					return { nodeName: `H${ level }` };
				},
			} ) ),
			...[ 'left', 'center', 'right' ].map( ( value ) => ( {
				type: 'shortcut',
				shortcut: value.charAt( 0 ),
				transform( attributes ) {
					const firstAlign = first( attributes ).align;
					const isSame = attributes.every( ( { align } ) => align === firstAlign );

					// If already aligned, set back to default.
					if ( isSame && firstAlign === value ) {
						return { align: undefined };
					}

					return { align: value };
				},
			} ) ),
		],
	},

	merge( attributes, attributesToMerge ) {
		return {
			content: concatChildren( attributes.content, attributesToMerge.content ),
		};
	},

	edit( { attributes, setAttributes, focus, setFocus, mergeBlocks, insertBlocksAfter, onReplace } ) {
		const { align, content, nodeName, placeholder } = attributes;

		return [
			focus && (
				<BlockControls
					key="controls"
					controls={
						'234'.split( '' ).map( ( level ) => ( {
							icon: 'heading',
							title: sprintf( __( 'Heading %s' ), level ),
							shortcut: level,
							isActive: 'H' + level === nodeName,
							onClick: () => setAttributes( { nodeName: 'H' + level } ),
							subscript: level,
						} ) )
					}
				/>
			),
			focus && (
				<InspectorControls key="inspector">
					<h3>{ __( 'Heading Settings' ) }</h3>
					<p>{ __( 'Level' ) }</p>
					<Toolbar
						controls={
							'123456'.split( '' ).map( ( level ) => ( {
								icon: 'heading',
								title: sprintf( __( 'Heading %s' ), level ),
								shortcut: level === '1' ? undefined : level,
								isActive: 'H' + level === nodeName,
								onClick: () => setAttributes( { nodeName: 'H' + level } ),
								subscript: level,
							} ) )
						}
					/>
					<p>{ __( 'Text Alignment' ) }</p>
					<AlignmentToolbar
						value={ align }
						onChange={ ( nextAlign ) => {
							setAttributes( { align: nextAlign } );
						} }
					/>
				</InspectorControls>
			),
			<Editable
				key="editable"
				wrapperClassName="wp-block-heading"
				tagName={ nodeName.toLowerCase() }
				value={ content }
				focus={ focus }
				onFocus={ setFocus }
				onChange={ ( value ) => setAttributes( { content: value } ) }
				onMerge={ mergeBlocks }
				onSplit={
					insertBlocksAfter ?
						( before, after, ...blocks ) => {
							setAttributes( { content: before } );
							insertBlocksAfter( [
								...blocks,
								createBlock( 'core/paragraph', { content: after } ),
							] );
						} :
						undefined
				}
				onRemove={ () => onReplace( [] ) }
				style={ { textAlign: align } }
				placeholder={ placeholder || __( 'Write heading…' ) }
			/>,
		];
	},

	save( { attributes } ) {
		const { align, nodeName, content } = attributes;
		const Tag = nodeName.toLowerCase();

		return (
			<Tag style={ { textAlign: align } } >
				{ content }
			</Tag>
		);
	},
} );
