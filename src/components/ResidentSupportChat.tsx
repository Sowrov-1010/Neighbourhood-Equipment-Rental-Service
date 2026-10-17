import React, { useMemo, useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ResidentSupportChat: React.FC = () => {
  const { currentUser, isAuthenticated, getResidentSupportByEmail, sendResidentSupportMessage } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState(isAuthenticated && currentUser.role === 'resident' ? currentUser.email : '');
  const [searchedEmail, setSearchedEmail] = useState('');
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [reply, setReply] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const conversation = useMemo(
    () => searchedEmail ? getResidentSupportByEmail(searchedEmail) : null,
    [getResidentSupportByEmail, searchedEmail]
  );
  const selectedRequest = conversation?.requests.find(request => request.id === selectedRequestId)
    || conversation?.requests[0];

  const loadConversations = (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return;
    setSearchedEmail(normalizedEmail);
    setSelectedRequestId('');
    setStatusMessage('');
  };

  const sendReply = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedRequest) return;
    const result = sendResidentSupportMessage(searchedEmail, selectedRequest.id, reply);
    if (!result.success) {
      setStatusMessage(result.error || 'Could not send your message.');
      return;
    }
    setReply('');
    setStatusMessage('Your message was sent to Resident Support.');
  };

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {isOpen && (
        <section className="mb-3 flex h-[min(70vh,34rem)] w-[min(92vw,24rem)] flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl">
          <header className="flex items-center justify-between bg-stone-900 px-4 py-3 text-white">
            <div>
              <h2 className="text-sm font-bold">Resident Support Chat</h2>
              <p className="text-[11px] text-stone-300">Credential recovery chat</p>
            </div>
            <button type="button" onClick={() => setIsOpen(false)} className="rounded p-1 text-stone-300 hover:bg-stone-800 hover:text-white" aria-label="Close support chat">
              <X className="h-4 w-4" />
            </button>
          </header>

          <form onSubmit={loadConversations} className="space-y-2 border-b border-stone-200 p-3">
            <label htmlFor="support-chat-email" className="block text-[11px] font-semibold text-stone-700">
              Enter your resident account email to view your request
            </label>
            <div className="flex gap-2">
              <input
                id="support-chat-email"
                type="email"
                required
                value={email}
                onChange={event => setEmail(event.target.value)}
                placeholder="name@example.com"
                className="min-w-0 flex-1 rounded-lg border border-stone-300 px-3 py-2 text-xs text-stone-900"
              />
              <button type="submit" className="rounded-lg bg-stone-900 px-3 py-2 text-xs font-bold text-white hover:bg-stone-700">
                View
              </button>
            </div>
            <p className="text-[10px] leading-relaxed text-stone-500">
              Email-only access does not verify inbox ownership. Do not send passwords or PINs in chat.
            </p>
          </form>

          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {!searchedEmail ? (
              <p className="py-8 text-center text-xs text-stone-500">Enter your email to load your credential recovery conversations.</p>
            ) : !conversation ? (
              <p className="py-8 text-center text-xs text-stone-500">No password or security PIN requests were found for this email.</p>
            ) : (
              <>
                <label htmlFor="support-chat-request" className="mb-1 block text-[11px] font-semibold text-stone-600">
                  Your requests
                </label>
                <select
                  id="support-chat-request"
                  value={selectedRequest?.id || ''}
                  onChange={event => setSelectedRequestId(event.target.value)}
                  className="mb-3 w-full rounded-lg border border-stone-300 bg-white px-2 py-2 text-xs text-stone-800"
                >
                  {conversation.requests.map(request => (
                    <option key={request.id} value={request.id}>
                      {request.category} · {request.status === 'open' ? 'Waiting for reply' : 'Resolved'}
                    </option>
                  ))}
                </select>

                {selectedRequest && (
                  <>
                    <div className="mb-3 rounded-lg bg-stone-100 p-2.5">
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">Your request</div>
                      <p className="mt-1 whitespace-pre-wrap text-xs text-stone-800">{selectedRequest.message}</p>
                    </div>
                    <div className="space-y-2">
                      {(selectedRequest.messages || []).map(message => (
                        <div
                          key={message.id}
                          className={`max-w-[90%] rounded-xl p-2.5 text-xs ${
                            message.sender === 'admin'
                              ? 'mr-auto border border-amber-200 bg-amber-50 text-stone-800'
                              : 'ml-auto bg-stone-900 text-white'
                          }`}
                        >
                          <div className="mb-1 text-[10px] font-bold opacity-70">
                            {message.sender === 'admin' ? `Support · ${message.senderName}` : 'You'}
                          </div>
                          <p className="whitespace-pre-wrap">{message.message}</p>
                          <time className="mt-1 block text-right text-[9px] opacity-60">
                            {new Date(message.createdAt).toLocaleString()}
                          </time>
                        </div>
                      ))}
                      {selectedRequest.status === 'resolved'
                        && selectedRequest.resolution
                        && !selectedRequest.messages?.some(message => message.message === selectedRequest.resolution)
                        && (
                        <div className="mr-auto max-w-[90%] rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-xs text-stone-800">
                          <div className="mb-1 text-[10px] font-bold text-amber-800">Resolution from Resident Support</div>
                          {selectedRequest.resolution}
                        </div>
                      )}
                      {(selectedRequest.messages || []).length === 0 && selectedRequest.status === 'open' && (
                        <p className="py-3 text-center text-xs text-stone-500">Your request is waiting for an administrator response.</p>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {selectedRequest?.status === 'open' && (
            <form onSubmit={sendReply} className="border-t border-stone-200 p-3">
              {statusMessage && <p className="mb-2 text-[11px] text-stone-600">{statusMessage}</p>}
              <div className="flex items-end gap-2">
                <textarea
                  rows={2}
                  value={reply}
                  onChange={event => setReply(event.target.value)}
                  placeholder="Write a message to Resident Support"
                  className="min-w-0 flex-1 resize-none rounded-lg border border-stone-300 px-3 py-2 text-xs text-stone-900"
                />
                <button type="submit" disabled={!reply.trim()} className="rounded-lg bg-amber-500 p-2.5 text-stone-950 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50" aria-label="Send message">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>
          )}
        </section>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(open => !open)}
        className="ml-auto flex items-center gap-2 rounded-full bg-amber-500 px-4 py-3 text-xs font-bold text-stone-950 shadow-lg hover:bg-amber-400"
        aria-expanded={isOpen}
      >
        {isOpen ? <X className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
        <span>{isOpen ? 'Close chat' : 'Support chat'}</span>
      </button>
    </div>
  );
};
