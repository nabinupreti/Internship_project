import Navbar from './Navbar';

export default function Layout({ children }) {
  return (
    <div className="main-bg min-h-screen">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8">
        {children}
      </main>
    </div>
  );
}
