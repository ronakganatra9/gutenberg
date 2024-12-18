/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { registerCoreBlocks } from '@wordpress/block-library';
import {
	BlockEditorProvider,
	BlockCanvas,
	BlockToolbar,
} from '@wordpress/block-editor';

/**
 * External dependencies
 */
import componentsStyles from '!!raw-loader!@wordpress/components/build-style/style.css?raw';
import blockEditorContentStyles from '!!raw-loader!@wordpress/block-editor/build-style/content.css?raw';
import blocksStyles from '!!raw-loader!@wordpress/block-library/build-style/style.css?raw';
import blocksEditorStyles from '!!raw-loader!@wordpress/block-library/build-style/editor.css?raw';

/**
 * Internal dependencies
 */
import editorStyles from '../editor-styles';

//Base styles for the content within the block canvas iframe.
const contentStyles = [
	{ css: componentsStyles },
	{ css: blockEditorContentStyles },
	{ css: blocksStyles },
	{ css: blocksEditorStyles },
	{ css: editorStyles },
];

import './style.css';

export default function EditorBox() {
	const [ blocks, updateBlocks ] = useState( [] );

	useEffect( () => {
		registerCoreBlocks();
	}, [] );

	return (
		// eslint-disable-next-line jsx-a11y/no-static-element-interactions
		<div
			className="editor-box"
			onKeyDown={ ( event ) => event.stopPropagation() }
		>
			<BlockEditorProvider
				value={ blocks }
				onInput={ updateBlocks }
				onChange={ updateBlocks }
				settings={ {
					hasFixedToolbar: true,
				} }
			>
				<BlockToolbar hideDragHandle />
				<BlockCanvas height="500px" styles={ contentStyles } />
			</BlockEditorProvider>
		</div>
	);
}
