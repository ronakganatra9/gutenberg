/**
 * External dependencies
 */
import { createStore as createReduxStore } from 'redux';

/**
 * WordPress Dependencies
 */
import { registerReducer } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { PREFERENCES_DEFAULTS } from './defaults';
import reducer from './reducer';
import { withRehydratation, loadAndPersist } from './persist';
import enhanceWithBrowserSize from './mobile';
import applyMiddlewares from './middlewares';
import { BREAK_MEDIUM } from './constants';

/**
 * Module Constants
 */
const STORAGE_KEY = `GUTENBERG_PREFERENCES_${ window.userSettings.uid }`;

/**
 * Creates a Redux store for editor state, enhanced with middlewares, persistence,
 * and browser size observer.
 *
 * @return {Object} Redux store
 */
export function createStore() {
	const store = applyMiddlewares( createReduxStore( withRehydratation( reducer, 'preferences' ) ) );
	loadAndPersist( store, 'preferences', STORAGE_KEY, PREFERENCES_DEFAULTS );
	enhanceWithBrowserSize( store, BREAK_MEDIUM );

	return store;
}

/**
 * Registers an editor state store, enhanced with middlewares, persistence, and
 * browser size observer.
 *
 * @return {Object} Registered data store
 */
export function createRegisteredStore() {
	const store = applyMiddlewares(
		registerReducer( 'core/editor', withRehydratation( reducer, 'preferences' ) )
	);
	loadAndPersist( store, 'preferences', STORAGE_KEY, PREFERENCES_DEFAULTS );
	enhanceWithBrowserSize( store, BREAK_MEDIUM );

	return store;
}

export default createRegisteredStore();
