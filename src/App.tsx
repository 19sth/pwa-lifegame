import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import MuImportExport from "./components/muimportexport";
import MuLayout from "./components/mulayout";
import Main from "./pages/main";
import TaskDetail from "./pages/taskdetail";
import { useEffect } from "react";
import { registerServiceWorker } from "./serviceWorkerRegistration";
import { BASE_PATH } from "./utils/constants";

function App() {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={`${BASE_PATH}/`} replace />} />
        <Route path={`${BASE_PATH}/`} element={<MuLayout />}>
          <Route index element={<Main />} />
          <Route path="task/:id" element={<TaskDetail />} />
          <Route path="importexport" element={<MuImportExport />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
