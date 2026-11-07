import { Button, IconButton, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { updatePageState } from "../redux/slicePage";
import { ContentCopy } from "@mui/icons-material";
import MuTakoz from "./mutakoz";
import { BASE_PATH, STORAGE_KEY } from "../utils/constants";

export default function MuImportExport() {
  const dispatch = useDispatch();
  const [appData, setAppData] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    dispatch(
      updatePageState({
        navItems: [],
        title: "import export",
      })
    );
  }, [dispatch]);

  useEffect(() => {
    const localAppData = localStorage.getItem(STORAGE_KEY) || "{}";
    try {
      setAppData(JSON.stringify(JSON.parse(localAppData), null, 2));
    } catch {
      setAppData(localAppData);
    }
  }, []);

  return (
    <div>
      <div className="flex justify-end">
        <IconButton
          aria-label="Copy"
          onClick={() => {
            navigator.clipboard.writeText(appData);
          }}
        >
          <ContentCopy />
        </IconButton>
      </div>

      <TextField
        label="App Data"
        multiline
        rows={20}
        value={appData}
        onChange={(e) => {
          setAppData(e.target.value);
          setError("");
        }}
        className="w-full pt-5"
      />

      {error ? <div className="text-sm text-red-700 mt-2">{error}</div> : null}

      <MuTakoz />
      <Button
        className="w-full"
        variant="contained"
        onClick={() => {
          try {
            const parsed = JSON.parse(appData);
            if (!parsed || typeof parsed !== "object") {
              throw new Error("bad");
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
            window.location.href = `${BASE_PATH}/`;
          } catch {
            setError("That data could not be read.");
          }
        }}
      >
        Save
      </Button>
    </div>
  );
}
