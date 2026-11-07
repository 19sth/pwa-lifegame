import { Button, TextField } from "@mui/material";
import { FormEvent, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import MuTakoz from "../components/mutakoz";
import { updatePageState } from "../redux/slicePage";
import { addTask } from "../redux/sliceTasks";
import { BASE_PATH } from "../utils/constants";

export default function TaskAdd() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [name, setName] = useState("");

  useEffect(() => {
    dispatch(
      updatePageState({
        navItems: [],
        title: "add",
      })
    );
  }, [dispatch]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    dispatch(addTask({ name }));
    navigate(`${BASE_PATH}/`);
  };

  return (
    <form onSubmit={submit}>
      <TextField
        className="w-full"
        label="New task"
        value={name}
        onChange={(event) => setName(event.target.value)}
        autoComplete="off"
      />
      <div className="text-xs text-gray-500 mt-2">Every day, once a day. Change it anytime.</div>
      <MuTakoz />
      <Button className="w-full" type="submit" variant="contained" size="large" disabled={!name.trim()}>
        Add
      </Button>
    </form>
  );
}
