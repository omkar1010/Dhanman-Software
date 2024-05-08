import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getMe } from '../features/authSlice';

const Rejection3S = () => {
  const dispatches = useDispatch();
  const navigate = useNavigate();
  const { isError, user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatches(getMe());
  }, [dispatches]);

  useEffect(() => {
    if (isError) {
      navigate("/");
    }
    if (user && user.role !== "dispatch" && user.role !== "admin") {
      navigate("/dashboard");
    }
  }, [isError, user, navigate]);

  return <div>Rejection 3 Screen</div>;
};

export default Rejection3S;

