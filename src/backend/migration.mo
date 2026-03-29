import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";
import Int "mo:core/Int";

module {
  type Transaction = {
    id : Nat;
    from : Principal;
    to : Principal;
    amount : Nat;
    timestamp : Int;
  };

  type NewActor = {
    balances : Map.Map<Principal, Nat>;
    transactions : Map.Map<Nat, Transaction>;
    nextTransactionId : Nat;
  };

  public func run(_old : {}) : NewActor {
    {
      balances = Map.empty<Principal, Nat>();
      transactions = Map.empty<Nat, Transaction>();
      nextTransactionId = 0;
    };
  };
};
