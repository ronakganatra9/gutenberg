/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

const alreadyLoaded = {};

function loadScript( url ) {
	if ( alreadyLoaded[ url ] ) {
		return Promise.resolve();
	}

	return new Promise( ( resolve, reject ) => {
		const script = document.createElement( 'script' );
		script.src = url;
		script.onload = () => {
			alreadyLoaded[ url ] = true;
			resolve();
		};
		script.onerror = () => {
			reject();
		};

		document.head.appendChild( script );
	} );
}

function loadStyle( url ) {
	if ( alreadyLoaded[ url ] ) {
		return Promise.resolve();
	}

	return new Promise( ( resolve, reject ) => {
		const style = document.createElement( 'link' );
		style.rel = 'stylesheet';
		style.href = url;
		style.onload = () => {
			alreadyLoaded[ url ] = true;
			resolve();
		};
		style.onerror = () => {
			reject();
		};

		document.head.appendChild( style );
	} );
}

function loadDependencies( scripts, styles ) {
	const promises = [];

	if ( scripts && scripts.length > 0 ) {
		const url = `/wp-admin/load-scripts.php?load=${ scripts.join( ',' ) }`;
		promises.push( loadScript( url ) );
	}

	if ( styles && styles.length > 0 ) {
		const url = `/wp-admin/load-styles.php?load=${ styles.join( ',' ) }`;
		promises.push( loadStyle( url ) );
	}

	return Promise.all( promises );
}

export default ( { scripts, styles, loadingComponent, errorComponent } ) => WrappedComponent =>
	class LazyDependencyComponent extends Component {
		constructor() {
			super( ...arguments );

			this.state = {
				status: 'pending',
			};
		}

		componentDidMount() {
			loadDependencies( scripts, styles ).then(
				() => {
					this.setState( { status: 'success' } );
				},
				() => {
					this.setState( { status: 'error' } );
				}
			);
		}

		render() {
			const { status } = this.state;

			if ( status === 'pending' ) {
				return loadingComponent && loadingComponent();
			}

			if ( status === 'error' ) {
				return errorComponent && errorComponent();
			}

			return <WrappedComponent { ...this.props } />;
		}
	};
