import { BrowserRouter, Routes, Route } from 'react-router';
import Home from './pages/Home';
import Create from './pages/Create';
import Layout from './components/Layout';
import Works from './pages/Works';
import Explore from './pages/Explore';
import Tutorials from './pages/Tutorials';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="create/:id" element={<Create />} />
          <Route path="works" element={<Works />} />
          <Route path="explore" element={<Explore />} />
          <Route path="tutorials" element={<Tutorials />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
