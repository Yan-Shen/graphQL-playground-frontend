import React, { useState, Fragment } from "react";
import { gql, useQuery, useMutation } from '@apollo/client';

import TodoItem from "./TodoItem";
import TodoFilters from "./TodoFilters";

const GET_MY_TODOS = gql`
    query getMyTodos {
        todos(where: { is_public: { _eq: false} }, order_by: { created_at: desc }) {
            id
            title
            created_at
            is_completed
        }
    }`;

// Remove all the todos that are completed
// use the gql function to parse the mutation string into a GraphQL document that you then pass to useMutation
const CLEAR_COMPLETED = gql`
    mutation clearCompleted {
        delete_todos(where: {is_completed: {_eq: true}, is_public: {_eq: false}}) {
            affected_rows
        }
    }
`;

const TodoPrivateListQuery = () => {
  // useQuery
  // https://www.apollographql.com/docs/react/api/react/hooks/#example-3
  const { loading, error, data } = useQuery(GET_MY_TODOS);

  if (loading) {
    return <div>Loading...</div>;
  }
  if (error) {
    console.error(error);
    return <div>Error!</div>;
  }
  return <TodoPrivateList todos={data.todos} />;
};

const TodoPrivateList = props => {
  const [state, setState] = useState({
    filter: "all",
    clearInProgress: false,
  });

  const filterResults = filter => {
    setState({
      ...state,
      filter: filter
    });
  };

  /*
  * useMutation returns a tuple that includes:
  * such as - const [mutateFunction, { data, loading, error }]
  * A mutate function that you can call at any time to execute the mutation
      Unlike useQuery, useMutation doesn't execute its operation automatically on render.
      Instead, you call this mutate function.
  * An object with fields that represent the current status of the mutation's execution (data, loading, etc.)
      This object is similar to the object returned by the useQuery hook.
  */
  const [clearCompletedTodos] = useMutation(CLEAR_COMPLETED);
  const clearCompleted = () => {
    clearCompletedTodos({
      optimisticResponse: true,
      update: (cache, {data}) => {
        const existingTodos = cache.readQuery({ query: GET_MY_TODOS });
        const newTodos = existingTodos.todos.filter(t => (!t.is_completed));
        cache.writeQuery({query:GET_MY_TODOS, data: {todos: newTodos}});
      }
    });
  };

  // let filteredTodos = state.todos;
  const {todos} = props;
  let filteredTodos = todos;
  if (state.filter === "active") {
    // filteredTodos = state.todos.filter(todo => todo.is_completed !== true);
    filteredTodos = todos.filter(todo => todo.is_completed !== true);
  } else if (state.filter === "completed") {
    // filteredTodos = state.todos.filter(todo => todo.is_completed === true);
    filteredTodos = todos.filter(todo => todo.is_completed === true);
  }

  const todoList = [];
  filteredTodos.forEach((todo, index) => {
    todoList.push(<TodoItem key={index} index={index} todo={todo} />);
  });

  return (
    <Fragment>
      <div className="todoListWrapper">
        <ul>{todoList}</ul>
      </div>

      <TodoFilters
        todos={filteredTodos}
        currentFilter={state.filter}
        filterResultsFn={filterResults}
        clearCompletedFn={clearCompleted}
        clearInProgress={state.clearInProgress}
      />
    </Fragment>
  );
};

// export default TodoPrivateList;

export default TodoPrivateListQuery;
export {GET_MY_TODOS};
