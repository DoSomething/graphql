/* global window, document */

import Oidc from 'oidc-client';
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { Playground, store } from 'graphql-playground-react';

import { ApolloLink } from 'apollo-link';
import { HttpLink } from 'apollo-link-http';
import { SubscriptionClient } from 'subscriptions-transport-ws';
import { WebSocketLink } from 'apollo-link-ws';
import { isSubscription } from 'graphql-playground-react/lib/components/Playground/util/hasSubscription';

Oidc.Log.logger = console;
Oidc.Log.level = Oidc.Log.DEBUG;

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = { accesToken: null };

    this.auth = new Oidc.UserManager({
      authority: 'http://northstar.test',
      response_type: 'token',
      client_id: 'dev-oauth',

      redirect_uri: `${window.location.origin}/`,
      post_logout_redirect_uri: `${window.location.origin}/`,
      scope: 'user activity role:staff role:admin openid',

      // @TODO: Look into automatic silent renewal... either with
      // iframe(?) for implicit flow or refresh token for PKCE.
      // silent_redirect_uri: `${window.location.origin}/`,
      // automaticSilentRenew: true,
    });

    this.login = this.login.bind(this);
    this.callback = this.callback.bind(this);
    this.logout = this.logout.bind(this);
    this.createApolloLink = this.createApolloLink.bind(this);
  }

  async componentDidMount() {
    const user = await this.auth.getUser();
    if (user) {
      this.setState({ accessToken: user.access_token });
      this.headers = { Authorization: `Bearer ${user.access_token}` };
    }

    // If we have a hash, we're (likely) completing implict flow:
    if (window.location.hash.length > 0) {
      this.callback();
    }
  }

  async login() {
    await this.auth.signinRedirect({ state: 'random state' });
  }

  async callback() {
    await this.auth.signinRedirectCallback();
    const user = await this.auth.getUser();
    this.headers = { Authorization: `Bearer ${user.access_token}` };

    // Remove the hash now that we've completed the login flow.
    const { pathname, search } = window.location;
    window.history.pushState('', document.title, pathname + search);
  }

  async logout() {
    await this.auth.signoutRedirect({ state: 'random' });

    this.setState({ accessToken: null });
    this.headers = {};
  }

  createApolloLink(session) {
    const { endpoint, credentials } = session;
    const headers = { ...session.headers, Authorization: '', ...this.headers };

    const subscriptionClient = new SubscriptionClient(endpoint, {
      timeout: 20000,
      lazy: true,
    });

    return {
      link: ApolloLink.split(
        operation => isSubscription(operation),
        new WebSocketLink(subscriptionClient),
        new HttpLink({ uri: endpoint, headers, credentials }),
      ),
      subscriptionClient,
    };
  }

  render() {
    const jwt = this.state.accessToken;

    // We can't use `headers` prop or `INJECT_HEADERS` Redux action because
    // they're tab-specific, and so logging in or out will only affect the
    // currently selected tab.
    //
    // Instead, we'll use `createApolloLink` to attach a custom "fetcher"
    // which merges Playground's query & custom headers with our own
    // Authorization header for logged-in users.
    return (
      <div>
        <div style={{ padding: '16px', paddingLeft: '42px' }}>
          <button onClick={this.login}>Login</button>
          <button onClick={this.logout} disabled={!jwt}>
            Logout
          </button>
          <code style={{ float: 'right' }}>
            {jwt ? `jwt: ${jwt.slice(0, 50)}..${jwt.slice(-50)}` : 'logged out'}
          </code>
        </div>
        <Provider store={store}>
          <Playground endpoint="/" createApolloLink={this.createApolloLink} />
        </Provider>
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('app'));
