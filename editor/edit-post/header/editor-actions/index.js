/**
 * WordPress dependencies
 */
import { MenuItemsGroup } from '@wordpress/components';
import { applyFilters } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';

export default function EditorActions() {
	const children = applyFilters( 'editor.EditorActions.children', [] );
	return (
		<MenuItemsGroup className="editor-actions"
			label={ __( 'Tools' ) }
		>
			{ children }
		</MenuItemsGroup>
	);
}
