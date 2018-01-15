/**
 * WordPress dependencies
 */
import { DropZone, FormFileUpload, Placeholder } from '@wordpress/components';
import { mediaUpload } from '@wordpress/utils';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import MediaUploadButton from '../media-upload-button';

/**
 *  ImagePlaceHolder is a react component used by blocks containing user configurable images e.g: image and cover image.
 *
 * @param   {Object} props  React props passed to the component.
 * @returns {Object}        Rendered placeholder.
 */
export default function ImagePlaceHolder( { className, icon, label, onSelectImage, multiple = false } ) {
	const setImage = ( [ image ] ) => onSelectImage( image );
	const dropFiles = ( files ) => mediaUpload( files, multiple ? onSelectImage : setImage );
	const uploadFromFiles = ( event ) => mediaUpload( event.target.files, multiple ? onSelectImage : setImage );
	return (
		<Placeholder
			className={ className }
			instructions={ multiple ? __( 'Drag images here or add from media library' ) : __( 'Drag image here or add from media library' ) }
			icon={ icon }
			label={ label } >
			<DropZone
				onFilesDrop={ dropFiles }
			/>
			<FormFileUpload
				multiple={ multiple }
				isLarge
				className="wp-block-image__upload-button"
				onChange={ uploadFromFiles }
				accept="image/*"
			>
				{ __( 'Upload' ) }
			</FormFileUpload>
			<MediaUploadButton
				buttonProps={ { isLarge: true } }
				gallery={ multiple }
				multiple={ multiple }
				onSelect={ onSelectImage }
				type="image"
			>
				{ __( 'Add from Media Library' ) }
			</MediaUploadButton>
		</Placeholder>
	);
}
