/**
 * WordPress dependencies
 */
import { ClipboardButton } from '@wordpress/components';
import { Component } from '@wordpress/element';
import { query } from '@wordpress/data';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';

class CopyContentButton extends Component {
	constructor() {
		super( ...arguments );
		this.state = { hasCopied: false };
		this.onCopy = this.onCopy.bind( this );
		this.onFinishCopy = this.onFinishCopy.bind( this );
	}
	onCopy() {
		this.setState( { hasCopied: true } );
	}
	onFinishCopy() {
		this.setState( { hasCopied: false } );
	}
	render() {
		return (
			<ClipboardButton
				text={ this.props.editedPostContent }
				className="components-menu-items__button"
				onCopy={ this.onCopy }
				onFinishCopy={ this.onFinishCopy }
			>
				{ this.state.hasCopied ?
					__( 'Copied!' ) :
					__( 'Copy All Content' ) }
			</ClipboardButton>
		);
	}
}

const Enhanced = query( ( select ) => ( {
	editedPostContent: select( 'core/editor', 'getEditedPostContent' ),
} ) )( CopyContentButton );

function withCopyContentButton( children ) {
	return [
		...children,
		<Enhanced key="copy-content-button" />,
	];
}

addFilter( 'editor.EditorActions.children',
	'core/copy-content/button', withCopyContentButton );
