/**
 * External dependencies
 */
import { connect } from 'react-redux';
import {
	findLast,
	map,
	invert,
	isEqual,
	mapValues,
	sortBy,
	throttle,
	find,
	first,
	castArray,
	every,
} from 'lodash';
import scrollIntoView from 'dom-scroll-into-view';
import 'element-closest';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { serialize, getPossibleShortcutTransformations } from '@wordpress/blocks';
import { keycodes } from '@wordpress/utils';

/**
 * Internal dependencies
 */
import './style.scss';
import BlockListBlock from './block';
import BlockListSiblingInserter from './sibling-inserter';
import {
	getBlockUids,
	getMultiSelectedBlocksStartUid,
	getMultiSelectedBlocksEndUid,
	getMultiSelectedBlocks,
	getMultiSelectedBlockUids,
	getSelectedBlock,
	isSelectionEnabled,
} from '../../store/selectors';
import { startMultiSelect, stopMultiSelect, multiSelect, selectBlock, replaceBlocks } from '../../store/actions';
import { documentHasSelection } from '../../utils/dom';

const { isAccess } = keycodes;

class BlockList extends Component {
	constructor( props ) {
		super( props );

		this.onSelectionStart = this.onSelectionStart.bind( this );
		this.onSelectionEnd = this.onSelectionEnd.bind( this );
		this.onShiftSelection = this.onShiftSelection.bind( this );
		this.onCopy = this.onCopy.bind( this );
		this.onCut = this.onCut.bind( this );
		this.setBlockRef = this.setBlockRef.bind( this );
		this.setLastClientY = this.setLastClientY.bind( this );
		this.onPointerMove = throttle( this.onPointerMove.bind( this ), 100 );
		// Browser does not fire `*move` event when the pointer position changes
		// relative to the document, so fire it with the last known position.
		this.onScroll = () => this.onPointerMove( { clientY: this.lastClientY } );
		this.onKeyDown = this.onKeyDown.bind( this );

		this.lastClientY = 0;
		this.nodes = {};
	}

	componentDidMount() {
		document.addEventListener( 'copy', this.onCopy );
		document.addEventListener( 'cut', this.onCut );
		window.addEventListener( 'mousemove', this.setLastClientY );
	}

	componentWillUnmount() {
		document.removeEventListener( 'copy', this.onCopy );
		document.removeEventListener( 'cut', this.onCut );
		window.removeEventListener( 'mousemove', this.setLastClientY );
	}

	componentWillReceiveProps( nextProps ) {
		const prevCommonName = this.commonName;

		if ( nextProps.selectedBlock ) {
			this.blocks = [ nextProps.selectedBlock ];
			this.commonName = nextProps.selectedBlock.name;
		} else if ( nextProps.multiSelectedBlocks.length ) {
			this.blocks = nextProps.multiSelectedBlocks;

			const firstName = first( nextProps.multiSelectedBlocks ).name

			if ( every( nextProps.multiSelectedBlocks, ( { name } ) => name === firstName ) ) {
				this.commonName = firstName;
			} else {
				delete this.commonName;
			}
		} else {
			delete this.blocks;
			delete this.commonName;
		}

		if ( ! this.commonName ) {
			delete this.shortcutTransforms;
		} else if ( this.commonName !== prevCommonName ) {
			this.shortcutTransforms = getPossibleShortcutTransformations( this.commonName );
		}

		if ( isEqual( this.props.multiSelectedBlockUids, nextProps.multiSelectedBlockUids ) ) {
			return;
		}

		if ( nextProps.multiSelectedBlockUids && nextProps.multiSelectedBlockUids.length > 0 ) {
			const extent = this.nodes[ nextProps.selectionEnd ];
			if ( extent ) {
				scrollIntoView( extent, extent.closest( '.editor-layout__content' ), {
					onlyScrollIfNeeded: true,
				} );
			}
		}
	}

	setLastClientY( { clientY } ) {
		this.lastClientY = clientY;
	}

	setBlockRef( node, uid ) {
		if ( node === null ) {
			delete this.nodes[ uid ];
		} else {
			this.nodes = {
				...this.nodes,
				[ uid ]: node,
			};
		}
	}

	onPointerMove( { clientY } ) {
		const boundaries = this.nodes[ this.selectionAtStart ].getBoundingClientRect();
		const y = clientY - boundaries.top;
		const key = findLast( this.coordMapKeys, ( coordY ) => coordY < y );

		this.onSelectionChange( this.coordMap[ key ] );
	}

	onCopy( event ) {
		const { multiSelectedBlocks, selectedBlock } = this.props;

		if ( ! multiSelectedBlocks.length && ! selectedBlock ) {
			return;
		}

		// Let native copy behaviour take over in input fields.
		if ( selectedBlock && documentHasSelection() ) {
			return;
		}

		const serialized = serialize( selectedBlock || multiSelectedBlocks );

		event.clipboardData.setData( 'text/plain', serialized );
		event.clipboardData.setData( 'text/html', serialized );

		event.preventDefault();
	}

	onCut( event ) {
		const { multiSelectedBlockUids } = this.props;

		this.onCopy( event );

		if ( multiSelectedBlockUids.length ) {
			this.props.onRemove( multiSelectedBlockUids );
		}
	}

	onSelectionStart( uid ) {
		if ( ! this.props.isSelectionEnabled ) {
			return;
		}

		const boundaries = this.nodes[ uid ].getBoundingClientRect();

		// Create a uid to Y coördinate map.
		const uidToCoordMap = mapValues( this.nodes, ( node ) =>
			node.getBoundingClientRect().top - boundaries.top );

		// Cache a Y coördinate to uid map for use in `onPointerMove`.
		this.coordMap = invert( uidToCoordMap );
		// Cache an array of the Y coördinates for use in `onPointerMove`.
		// Sort the coördinates, as `this.nodes` will not necessarily reflect
		// the current block sequence.
		this.coordMapKeys = sortBy( Object.values( uidToCoordMap ) );
		this.selectionAtStart = uid;

		window.addEventListener( 'mousemove', this.onPointerMove );
		// Capture scroll on all elements.
		window.addEventListener( 'scroll', this.onScroll, true );
		window.addEventListener( 'mouseup', this.onSelectionEnd );

		this.props.onStartMultiSelect();
	}

	onSelectionChange( uid ) {
		const { onMultiSelect, selectionStart, selectionEnd } = this.props;
		const { selectionAtStart } = this;
		const isAtStart = selectionAtStart === uid;

		if ( ! selectionAtStart || ! this.props.isSelectionEnabled ) {
			return;
		}

		if ( isAtStart && selectionStart ) {
			onMultiSelect( null, null );
		}

		if ( ! isAtStart && selectionEnd !== uid ) {
			onMultiSelect( selectionAtStart, uid );
		}
	}

	onSelectionEnd() {
		// Cancel throttled calls.
		this.onPointerMove.cancel();

		delete this.coordMap;
		delete this.coordMapKeys;
		delete this.selectionAtStart;

		window.removeEventListener( 'mousemove', this.onPointerMove );
		window.removeEventListener( 'scroll', this.onScroll, true );
		window.removeEventListener( 'mouseup', this.onSelectionEnd );

		this.props.onStopMultiSelect();
	}

	onShiftSelection( uid ) {
		if ( ! this.props.isSelectionEnabled ) {
			return;
		}

		const { selectedBlock, selectionStart, onMultiSelect, onSelect } = this.props;

		if ( selectedBlock ) {
			onMultiSelect( selectedBlock.uid, uid );
		} else if ( selectionStart ) {
			onMultiSelect( selectionStart, uid );
		} else {
			onSelect( uid );
		}
	}

	onKeyDown( event ) {
		const { onReplace } = this.props;

		if ( ! this.shortcutTransforms ) {
			return;
		}

		const transform = find( this.shortcutTransforms, ( { shortcut } ) => isAccess( event, shortcut ) );

		if ( transform ) {
			const blocks = castArray( transform.transform( this.blocks.map( ( { attributes } ) => attributes ) ) );

			onReplace( this.blocks.map( ( { uid } ) => uid ), blocks );

			return;
		}
	}

	render() {
		const { blocks, showContextualToolbar } = this.props;

		return (
			<div onKeyDown={ this.onKeyDown }>
				{ !! blocks.length && <BlockListSiblingInserter /> }
				{ map( blocks, ( uid ) => (
					<BlockListBlock
						key={ 'block-' + uid }
						uid={ uid }
						blockRef={ this.setBlockRef }
						onSelectionStart={ this.onSelectionStart }
						onShiftSelection={ this.onShiftSelection }
						showContextualToolbar={ showContextualToolbar }
					/>
				) ) }
			</div>
		);
	}
}

export default connect(
	( state ) => ( {
		blocks: getBlockUids( state ),
		selectionStart: getMultiSelectedBlocksStartUid( state ),
		selectionEnd: getMultiSelectedBlocksEndUid( state ),
		multiSelectedBlocks: getMultiSelectedBlocks( state ),
		multiSelectedBlockUids: getMultiSelectedBlockUids( state ),
		selectedBlock: getSelectedBlock( state ),
		isSelectionEnabled: isSelectionEnabled( state ),
	} ),
	( dispatch ) => ( {
		onStartMultiSelect() {
			dispatch( startMultiSelect() );
		},
		onStopMultiSelect() {
			dispatch( stopMultiSelect() );
		},
		onMultiSelect( start, end ) {
			dispatch( multiSelect( start, end ) );
		},
		onSelect( uid ) {
			dispatch( selectBlock( uid ) );
		},
		onRemove( uids ) {
			dispatch( { type: 'REMOVE_BLOCKS', uids } );
		},
		onReplace( uids, blocks ) {
			dispatch( replaceBlocks( uids, blocks ) );
		},
	} )
)( BlockList );
