import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getMe } from '../features/authSlice';

const HeatsPage = () => {
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
    if (user && user.role !== "melting" && user.role !== "admin") {
      navigate("/dashboard");
    }
  }, [isError, user, navigate]);

  return (
    <>
    
    </>
  )
};

export default HeatsPage;


