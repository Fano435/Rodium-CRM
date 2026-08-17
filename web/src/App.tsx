import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ContactsView } from "./features/contacts/ContactsView";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ContactsView />
    </QueryClientProvider>
  );
}

export default App;
