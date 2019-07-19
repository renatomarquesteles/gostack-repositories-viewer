import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
  MdArrowBack,
  MdKeyboardArrowRight,
  MdKeyboardArrowLeft,
} from 'react-icons/md';

import api from '../../services/api';
import Container from '../../components/Container';
import {
  Filter,
  FilterButton,
  Loading,
  Owner,
  IssueList,
  Pagination,
} from './styles';

export default class Repository extends Component {
  static propTypes = {
    match: PropTypes.shape({
      params: PropTypes.shape({
        repository: PropTypes.string,
      }),
    }).isRequired,
  };

  state = {
    repository: {},
    issues: [],
    issuesFilter: 'open',
    loading: true,
    page: 1,
  };

  async componentDidMount() {
    const { match } = this.props;

    const { issuesFilter } = this.state;

    const repoName = decodeURIComponent(match.params.repository);
    const [repository, issues] = await Promise.all([
      api.get(`/repos/${repoName}`),
      api.get(`/repos/${repoName}/issues`, {
        params: {
          state: `${issuesFilter}`,
          per_page: 5,
        },
      }),
    ]);

    this.setState({
      repository: repository.data,
      issues: issues.data,
      loading: false,
    });
  }

  async filterIssues(state) {
    const { issuesFilter } = this.state;

    if (issuesFilter === state) {
      return;
    }

    await this.setState({ issuesFilter: state });

    this.loadIssues();
  }

  async loadIssues() {
    const { page, issuesFilter } = this.state;
    const { match } = this.props;
    const repoName = decodeURIComponent(match.params.repository);
    const issues = await api.get(`/repos/${repoName}/issues`, {
      params: {
        state: `${issuesFilter}`,
        per_page: 5,
        page,
      },
    });
    this.setState({ issues: [] });
    this.setState({
      issues: issues.data,
    });
  }

  async handlePage(action) {
    const { page } = this.state;
    await this.setState({ page: action === 'next' ? page + 1 : page - 1 });
    this.loadIssues();
  }

  render() {
    const { repository, issues, issuesFilter, loading, page } = this.state;

    if (loading) {
      return <Loading>Carregando</Loading>;
    }

    return (
      <Container>
        <Link to="/">
          <MdArrowBack size="30" color="#222" />
        </Link>
        <Owner>
          <img src={repository.owner.avatar_url} alt={repository.owner.login} />
          <h1>{repository.name}</h1>
          <p>{repository.description}</p>
        </Owner>
        <IssueList>
          <Filter filter={issuesFilter}>
            <FilterButton
              type="button"
              active={issuesFilter === 'all'}
              onClick={() => this.filterIssues('all')}
            >
              TODAS
            </FilterButton>
            <FilterButton
              type="button"
              active={issuesFilter === 'open'}
              onClick={() => this.filterIssues('open')}
            >
              ABERTAS
            </FilterButton>
            <FilterButton
              type="button"
              active={issuesFilter === 'closed'}
              onClick={() => this.filterIssues('closed')}
            >
              FECHADAS
            </FilterButton>
          </Filter>
          {issues.map(issue => (
            <li key={String(issue.id)}>
              <img src={issue.user.avatar_url} alt={issue.user.login} />
              <div>
                <strong>
                  <a href={issue.html_url}>{issue.title}</a>
                  {issue.labels.map(label => (
                    <span key={String(label.id)}>{label.name}</span>
                  ))}
                </strong>
                <p>{issue.user.login}</p>
              </div>
            </li>
          ))}
        </IssueList>
        <Pagination>
          <button
            type="button"
            disabled={page < 2}
            onClick={() => this.handlePage('back')}
          >
            <MdKeyboardArrowLeft size="24" />
          </button>
          <span>Página {page}</span>
          <button type="button" onClick={() => this.handlePage('next')}>
            <MdKeyboardArrowRight size="24" />
          </button>
        </Pagination>
      </Container>
    );
  }
}
